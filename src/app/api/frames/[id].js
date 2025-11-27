import { getServerSession } from 'next-auth';
import dbConnect from '../../../lib/dbConnect';
import Frame from '../../../models/Frame';

export default async function handler(req, res) {
  const session = await getServerSession(req, res);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  await dbConnect();

  switch (req.method) {
    case 'GET':
      try {
        const frame = await Frame.findById(id);
        if (!frame) {
          return res.status(404).json({ error: 'Frame not found' });
        }
        res.status(200).json(frame);
      } catch (error) {
        console.error('Frame fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch frame' });
      }
      break;

    case 'PUT':
      try {
        const { name, category, unitPrice, quantity, description, lowStockThreshold } = req.body;
        
        const frame = await Frame.findByIdAndUpdate(
          id,
          { name, category, unitPrice, quantity, description, lowStockThreshold },
          { new: true, runValidators: true }
        );
        
        if (!frame) {
          return res.status(404).json({ error: 'Frame not found' });
        }
        
        res.status(200).json(frame);
      } catch (error) {
        console.error('Frame update error:', error);
        res.status(500).json({ error: 'Failed to update frame' });
      }
      break;

    case 'DELETE':
      // Only admins can delete frames (handled by middleware)
      try {
        const frame = await Frame.findByIdAndDelete(id);
        
        if (!frame) {
          return res.status(404).json({ error: 'Frame not found' });
        }
        
        res.status(200).json({ message: 'Frame deleted successfully' });
      } catch (error) {
        console.error('Frame deletion error:', error);
        res.status(500).json({ error: 'Failed to delete frame' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}