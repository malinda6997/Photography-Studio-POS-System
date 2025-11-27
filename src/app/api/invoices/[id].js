import { getServerSession } from 'next-auth';
import dbConnect from '../../../lib/dbConnect';
import Invoice from '../../../models/Invoice';

export default async function handler(req, res) {
  const session = await getServerSession(req, res);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  await dbConnect();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const invoice = await Invoice.findById(id)
      .populate('customer', 'name mobile email notes')
      .populate('createdBy', 'name')
      .populate('items.refId', 'name category');
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.status(200).json(invoice);
  } catch (error) {
    console.error('Invoice fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
}