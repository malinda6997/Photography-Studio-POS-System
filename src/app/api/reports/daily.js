import { getServerSession } from 'next-auth';
import dbConnect from '../../../lib/dbConnect';
import Payment from '../../../models/Payment';
import Expense from '../../../models/Expense';
import Invoice from '../../../models/Invoice';
import Frame from '../../../models/Frame';

export default async function handler(req, res) {
  const session = await getServerSession(req, res);
  
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  await dbConnect();

  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD)' });
    }

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const dateQuery = {
      date: {
        $gte: startDate,
        $lt: endDate
      }
    };

    // Get daily income from payments
    const paymentsResult = await Payment.aggregate([
      {
        $match: dateQuery
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get daily expenses
    const expensesResult = await Expense.aggregate([
      {
        $match: dateQuery
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get invoice statistics for the day
    const invoiceStats = await Invoice.aggregate([
      {
        $match: dateQuery
      },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$subtotal' }
        }
      }
    ]);

    // Get low stock items
    const lowStockItems = await Frame.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    }).sort({ quantity: 1 });

    const totalIncome = paymentsResult[0]?.totalIncome || 0;
    const totalExpenses = expensesResult[0]?.totalExpenses || 0;
    const netIncome = totalIncome - totalExpenses;

    const report = {
      date,
      income: {
        total: totalIncome,
        paymentsCount: paymentsResult[0]?.count || 0
      },
      expenses: {
        total: totalExpenses,
        expensesCount: expensesResult[0]?.count || 0
      },
      netIncome,
      invoices: {
        stats: invoiceStats,
        totalInvoices: invoiceStats.reduce((sum, stat) => sum + stat.count, 0)
      },
      lowStockItems: lowStockItems.map(frame => ({
        id: frame._id,
        name: frame.name,
        category: frame.category,
        quantity: frame.quantity,
        lowStockThreshold: frame.lowStockThreshold
      }))
    };

    res.status(200).json(report);
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
}