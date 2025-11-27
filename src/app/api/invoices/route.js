import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/dbConnect';
import Invoice from '../../../../models/Invoice';
import Frame from '../../../../models/Frame';
import Customer from '../../../../models/Customer';
import { getNextSequence, generateInvoiceNumber, calculatePaymentStatus } from '../../../../lib/utils';

export default async function handler(req, res) {
  const session = await getServerSession(req, res);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await dbConnect();

  switch (req.method) {
    case 'GET':
      try {
        const { page = 1, limit = 10, search, status } = req.query;
        let query = {};
        
        if (search) {
          query = {
            $or: [
              { invoiceNo: { $regex: search, $options: 'i' } }
            ]
          };
        }
        
        if (status && ['pending', 'partial', 'paid'].includes(status)) {
          query.paymentStatus = status;
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const invoices = await Invoice.find(query)
          .populate('customer', 'name mobile')
          .populate('createdBy', 'name')
          .sort({ date: -1 })
          .skip(skip)
          .limit(parseInt(limit));
          
        const total = await Invoice.countDocuments(query);
        
        res.status(200).json({
          invoices,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            total
          }
        });
      } catch (error) {
        console.error('Invoices fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
      }
      break;

    case 'POST':
      const session_db = await mongoose.startSession();
      
      try {
        await session_db.withTransaction(async () => {
          const { customerId, items, advancePaid = 0, notes } = req.body;
          
          if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Customer ID and items are required');
          }

          // Validate customer exists
          const customer = await Customer.findById(customerId).session(session_db);
          if (!customer) {
            throw new Error('Customer not found');
          }

          // Calculate subtotal and validate frame quantities
          let subtotal = 0;
          const processedItems = [];

          for (const item of items) {
            const { type, description, qty, unitPrice, refId } = item;
            
            if (!type || !description || !qty || qty <= 0 || !unitPrice || unitPrice < 0) {
              throw new Error('Invalid item data');
            }

            const itemTotal = qty * unitPrice;
            subtotal += itemTotal;

            if (type === 'frame' && refId) {
              // Validate frame exists and has sufficient stock
              const frame = await Frame.findById(refId).session(session_db);
              if (!frame) {
                throw new Error(`Frame not found: ${description}`);
              }
              
              if (frame.quantity < qty) {
                throw new Error(`Insufficient stock for ${frame.name}. Available: ${frame.quantity}, Required: ${qty}`);
              }
              
              // Reduce frame quantity
              await Frame.findByIdAndUpdate(
                refId,
                { $inc: { quantity: -qty } },
                { session: session_db }
              );
            }

            processedItems.push({
              type,
              description,
              qty,
              unitPrice,
              total: itemTotal,
              refId: type === 'frame' ? refId : undefined
            });
          }

          // Generate invoice number
          const sequence = await getNextSequence('invoice');
          const invoiceNo = generateInvoiceNumber(sequence);

          // Calculate payment status
          const totalPaid = Math.min(advancePaid, subtotal);
          const paymentStatus = calculatePaymentStatus(subtotal, totalPaid);

          // Create invoice
          const invoice = new Invoice({
            invoiceNo,
            customer: customerId,
            items: processedItems,
            subtotal,
            advancePaid: totalPaid,
            totalPaid,
            paymentStatus,
            createdBy: session.user.id,
            notes
          });

          await invoice.save({ session: session_db });
          
          // Populate customer data for response
          await invoice.populate('customer', 'name mobile email');
          await invoice.populate('createdBy', 'name');
          
          return invoice;
        });

        // Fetch the created invoice with populated data
        const createdInvoice = await Invoice.findOne({ invoiceNo: generateInvoiceNumber(await getNextSequence('invoice') - 1) })
          .populate('customer', 'name mobile email')
          .populate('createdBy', 'name');
        
        res.status(201).json(createdInvoice);
      } catch (error) {
        console.error('Invoice creation error:', error);
        res.status(400).json({ error: error.message || 'Failed to create invoice' });
      } finally {
        await session_db.endSession();
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
