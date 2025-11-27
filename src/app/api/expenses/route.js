import { getServerSession } from 'next-auth';
import dbConnect from '../../../../lib/dbConnect';
import Expense from '../../../../models/Expense';

export default async function handler(req, res) {
  const session = await getServerSession(req, res);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await dbConnect();

  switch (req.method) {
    case 'GET':
      try {
        const { date, category, page = 1, limit = 10 } = req.query;
        let query = {};
        
        if (date) {
          const startDate = new Date(date);
          const endDate = new Date(date);
          endDate.setDate(endDate.getDate() + 1);
          
          query.date = {
            $gte: startDate,
            $lt: endDate
          };
        }
        
        if (category && ['supplies', 'utilities', 'maintenance', 'marketing', 'other'].includes(category)) {
          query.category = category;
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const expenses = await Expense.find(query)
          .populate('createdBy', 'name')
          .sort({ date: -1 })
          .skip(skip)
          .limit(parseInt(limit));
          
        const total = await Expense.countDocuments(query);
        
        res.status(200).json({
          expenses,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            total
          }
        });
      } catch (error) {
        console.error('Expenses fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
      }
      break;

    case 'POST':
      try {
        const { title, amount, category = 'other', note } = req.body;
        
        if (!title || !amount || amount <= 0) {
          return res.status(400).json({ error: 'Title and positive amount are required' });
        }

        const expense = new Expense({
          title,
          amount,
          category,
          note,
          createdBy: session.user.id
        });

        await expense.save();
        
        // Populate creator data for response
        await expense.populate('createdBy', 'name');
        
        res.status(201).json(expense);
      } catch (error) {
        console.error('Expense creation error:', error);
        res.status(500).json({ error: 'Failed to create expense' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
