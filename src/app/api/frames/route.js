import { getServerSession } from 'next-auth';
import dbConnect from '../../../../lib/dbConnect';
import Frame from '../../../../models/Frame';

export default async function handler(req, res) {
  const session = await getServerSession(req, res);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await dbConnect();

  switch (req.method) {
    case 'GET':
      try {
        const { search, lowStock } = req.query;
        let query = {};
        
        if (search) {
          query = {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { category: { $regex: search, $options: 'i' } }
            ]
          };
        }
        
        if (lowStock === 'true') {
          query = { ...query, $expr: { $lte: ['$quantity', '$lowStockThreshold'] } };
        }
        
        const frames = await Frame.find(query).sort({ name: 1 });
        res.status(200).json(frames);
      } catch (error) {
        console.error('Frames fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch frames' });
      }
      break;

    case 'POST':
      try {
        const { name, category, unitPrice, quantity, description, lowStockThreshold } = req.body;
        
        if (!name || !category || unitPrice == null || quantity == null) {
          return res.status(400).json({ error: 'Name, category, unit price, and quantity are required' });
        }

        const frame = new Frame({ 
          name, 
          category, 
          unitPrice, 
          quantity, 
          description, 
          lowStockThreshold 
        });
        await frame.save();
        
        res.status(201).json(frame);
      } catch (error) {
        console.error('Frame creation error:', error);
        res.status(500).json({ error: 'Failed to create frame' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
