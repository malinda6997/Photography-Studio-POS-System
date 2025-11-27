import { getServerSession } from 'next-auth';
import { getNextSequence, generateInvoiceNumber, generateReceiptNumber } from '../../../lib/utils';

export default async function handler(req, res) {
  const session = await getServerSession(req, res);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { name } = req.query;
    
    if (!name || !['invoice', 'receipt'].includes(name)) {
      return res.status(400).json({ error: 'Valid counter name (invoice or receipt) is required' });
    }

    const sequence = await getNextSequence(name);
    
    let generatedNumber;
    if (name === 'invoice') {
      generatedNumber = generateInvoiceNumber(sequence);
    } else {
      generatedNumber = generateReceiptNumber(sequence);
    }
    
    res.status(200).json({ 
      sequence, 
      number: generatedNumber 
    });
  } catch (error) {
    console.error('Counter increment error:', error);
    res.status(500).json({ error: 'Failed to increment counter' });
  }
}