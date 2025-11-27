import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/dbConnect';
import Payment from '../../../../models/Payment';
import Invoice from '../../../../models/Invoice';
import { getNextSequence, generateReceiptNumber, calculatePaymentStatus } from '../../../../lib/utils';

export default async function handler(req, res) {
  const session = await getServerSession(req, res);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await dbConnect();

  switch (req.method) {
    case 'GET':
      try {
        const { invoiceId, page = 1, limit = 10 } = req.query;
        let query = {};
        
        if (invoiceId) {
          query.invoice = invoiceId;
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const payments = await Payment.find(query)
          .populate('invoice', 'invoiceNo subtotal')
          .populate('receivedBy', 'name')
          .sort({ date: -1 })
          .skip(skip)
          .limit(parseInt(limit));
          
        res.status(200).json(payments);
      } catch (error) {
        console.error('Payments fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
      }
      break;

    case 'POST':
      const session_db = await mongoose.startSession();
      
      try {
        const result = await session_db.withTransaction(async () => {
          const { invoiceId, amount, method, paymentType, note } = req.body;
          
          if (!invoiceId || !amount || amount <= 0 || !method || !paymentType) {
            throw new Error('Invoice ID, amount, method, and payment type are required');
          }

          // Validate invoice exists
          const invoice = await Invoice.findById(invoiceId).session(session_db);
          if (!invoice) {
            throw new Error('Invoice not found');
          }

          // Check if payment amount is valid
          const remainingAmount = invoice.subtotal - invoice.totalPaid;
          if (amount > remainingAmount) {
            throw new Error(`Payment amount exceeds remaining balance. Remaining: ${remainingAmount}`);
          }

          // Generate receipt number
          const sequence = await getNextSequence('receipt');
          const receiptNo = generateReceiptNumber(sequence);

          // Create payment record
          const payment = new Payment({
            invoice: invoiceId,
            amount,
            method,
            paymentType,
            receiptNo,
            receivedBy: session.user.id,
            note
          });

          await payment.save({ session: session_db });

          // Update invoice totals and payment status
          const newTotalPaid = invoice.totalPaid + amount;
          const newPaymentStatus = calculatePaymentStatus(invoice.subtotal, newTotalPaid);

          await Invoice.findByIdAndUpdate(
            invoiceId,
            {
              totalPaid: newTotalPaid,
              paymentStatus: newPaymentStatus
            },
            { session: session_db }
          );

          return payment;
        });

        // Fetch the created payment with populated data
        const createdPayment = await Payment.findById(result._id)
          .populate('invoice', 'invoiceNo subtotal totalPaid paymentStatus')
          .populate('receivedBy', 'name');
        
        res.status(201).json(createdPayment);
      } catch (error) {
        console.error('Payment creation error:', error);
        res.status(400).json({ error: error.message || 'Failed to create payment' });
      } finally {
        await session_db.endSession();
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
