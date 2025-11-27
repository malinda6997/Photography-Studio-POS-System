import { getServerSession } from 'next-auth';
import dbConnect from '../../../../lib/dbConnect';
import Booking from '../../../../models/Booking';
import Customer from '../../../../models/Customer';

export default async function handler(req, res) {
  const session = await getServerSession(req, res);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await dbConnect();

  switch (req.method) {
    case 'GET':
      try {
        const { date, status } = req.query;
        let query = {};
        
        if (date) {
          const startDate = new Date(date);
          const endDate = new Date(date);
          endDate.setDate(endDate.getDate() + 1);
          
          query.bookingDate = {
            $gte: startDate,
            $lt: endDate
          };
        }
        
        if (status && ['scheduled', 'completed', 'cancelled'].includes(status)) {
          query.status = status;
        }
        
        const bookings = await Booking.find(query)
          .populate('customer', 'name mobile')
          .populate('invoiceRef', 'invoiceNo subtotal')
          .sort({ bookingDate: 1, slotTime: 1 });
          
        res.status(200).json(bookings);
      } catch (error) {
        console.error('Bookings fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
      }
      break;

    case 'POST':
      try {
        const { customerId, bookingDate, slotTime, advancePaid = 0, notes, invoiceRef } = req.body;
        
        if (!customerId || !bookingDate || !slotTime) {
          return res.status(400).json({ error: 'Customer ID, booking date, and time slot are required' });
        }

        // Validate customer exists
        const customer = await Customer.findById(customerId);
        if (!customer) {
          return res.status(400).json({ error: 'Customer not found' });
        }

        // Check for conflicting bookings
        const conflictingBooking = await Booking.findOne({
          bookingDate: new Date(bookingDate),
          slotTime,
          status: 'scheduled'
        });

        if (conflictingBooking) {
          return res.status(400).json({ error: 'Time slot is already booked' });
        }

        const booking = new Booking({
          customer: customerId,
          bookingDate: new Date(bookingDate),
          slotTime,
          advancePaid,
          notes,
          invoiceRef
        });

        await booking.save();
        
        // Populate customer data for response
        await booking.populate('customer', 'name mobile');
        if (booking.invoiceRef) {
          await booking.populate('invoiceRef', 'invoiceNo subtotal');
        }
        
        res.status(201).json(booking);
      } catch (error) {
        console.error('Booking creation error:', error);
        res.status(500).json({ error: 'Failed to create booking' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
