import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import models
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Frame from '../models/Frame.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Counter from '../models/Counter.js';

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function clearDatabase() {
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Customer.deleteMany({}),
    Frame.deleteMany({}),
    Invoice.deleteMany({}),
    Payment.deleteMany({}),
    Expense.deleteMany({}),
    Counter.deleteMany({})
  ]);
  console.log('Database cleared');
}

async function seedUsers() {
  console.log('Seeding users...');
  
  const users = [
    {
      name: 'Admin User',
      email: 'admin@shine.com',
      passwordHash: await bcrypt.hash('admin123', 12),
      role: 'admin'
    },
    {
      name: 'Staff User',
      email: 'staff@shine.com',
      passwordHash: await bcrypt.hash('staff123', 12),
      role: 'staff'
    }
  ];

  const createdUsers = await User.insertMany(users);
  console.log(`Created ${createdUsers.length} users`);
  return createdUsers;
}

async function seedCustomers() {
  console.log('Seeding customers...');
  
  const customers = [
    {
      name: 'John Perera',
      mobile: '0771234567',
      email: 'john@email.com',
      notes: 'Regular customer'
    },
    {
      name: 'Mary Silva',
      mobile: '0779876543',
      email: 'mary@email.com',
      notes: 'Prefers evening appointments'
    },
    {
      name: 'David Fernando',
      mobile: '0712345678',
      email: 'david@email.com',
      notes: 'Wedding photographer referral'
    },
    {
      name: 'Sarah Wickramasinghe',
      mobile: '0765432109',
      email: 'sarah@email.com'
    },
    {
      name: 'Michael De Silva',
      mobile: '0787654321',
      email: 'michael@email.com',
      notes: 'Corporate client'
    }
  ];

  const createdCustomers = await Customer.insertMany(customers);
  console.log(`Created ${createdCustomers.length} customers`);
  return createdCustomers;
}

async function seedFrames() {
  console.log('Seeding frames...');
  
  const frames = [
    {
      name: 'Classic Wood Frame 8x10',
      category: 'Wood',
      unitPrice: 2500,
      quantity: 25,
      description: 'Classic wooden frame with glass',
      lowStockThreshold: 5
    },
    {
      name: 'Modern Metal Frame 5x7',
      category: 'Metal',
      unitPrice: 1800,
      quantity: 3, // Low stock
      description: 'Sleek metal frame',
      lowStockThreshold: 5
    },
    {
      name: 'Vintage Wood Frame 11x14',
      category: 'Wood',
      unitPrice: 3500,
      quantity: 15,
      description: 'Antique-style wooden frame',
      lowStockThreshold: 5
    },
    {
      name: 'Digital Print Frame 4x6',
      category: 'Plastic',
      unitPrice: 800,
      quantity: 50,
      description: 'Basic plastic frame for digital prints',
      lowStockThreshold: 10
    },
    {
      name: 'Premium Glass Frame 12x16',
      category: 'Glass',
      unitPrice: 4500,
      quantity: 2, // Low stock
      description: 'Premium glass frame with metal edges',
      lowStockThreshold: 5
    },
    {
      name: 'Canvas Frame 16x20',
      category: 'Canvas',
      unitPrice: 3200,
      quantity: 12,
      description: 'Stretched canvas frame',
      lowStockThreshold: 3
    }
  ];

  const createdFrames = await Frame.insertMany(frames);
  console.log(`Created ${createdFrames.length} frames`);
  return createdFrames;
}

async function seedCounters() {
  console.log('Seeding counters...');
  
  const counters = [
    { name: 'invoice', seq: 0 },
    { name: 'receipt', seq: 0 }
  ];

  await Counter.insertMany(counters);
  console.log('Created counters');
}

async function seedInvoicesAndPayments(users, customers, frames) {
  console.log('Seeding invoices and payments...');
  
  const adminUser = users.find(u => u.role === 'admin');
  const staffUser = users.find(u => u.role === 'staff');
  
  // Create some sample invoices
  const invoices = [
    {
      invoiceNo: 'INV-2025-00001',
      customer: customers[0]._id,
      items: [
        {
          type: 'service',
          description: 'Portrait Photography Session',
          qty: 1,
          unitPrice: 15000,
          total: 15000
        },
        {
          type: 'frame',
          description: frames[0].name,
          qty: 2,
          unitPrice: frames[0].unitPrice,
          total: frames[0].unitPrice * 2,
          refId: frames[0]._id
        }
      ],
      subtotal: 20000,
      advancePaid: 5000,
      totalPaid: 20000,
      paymentStatus: 'paid',
      createdBy: staffUser._id,
      date: new Date('2025-11-26')
    },
    {
      invoiceNo: 'INV-2025-00002',
      customer: customers[1]._id,
      items: [
        {
          type: 'service',
          description: 'Wedding Photography Package',
          qty: 1,
          unitPrice: 75000,
          total: 75000
        },
        {
          type: 'frame',
          description: frames[2].name,
          qty: 5,
          unitPrice: frames[2].unitPrice,
          total: frames[2].unitPrice * 5,
          refId: frames[2]._id
        }
      ],
      subtotal: 92500,
      advancePaid: 25000,
      totalPaid: 25000,
      paymentStatus: 'partial',
      createdBy: adminUser._id,
      date: new Date('2025-11-27')
    },
    {
      invoiceNo: 'INV-2025-00003',
      customer: customers[2]._id,
      items: [
        {
          type: 'service',
          description: 'Product Photography',
          qty: 1,
          unitPrice: 12000,
          total: 12000
        }
      ],
      subtotal: 12000,
      advancePaid: 0,
      totalPaid: 0,
      paymentStatus: 'pending',
      createdBy: staffUser._id,
      date: new Date('2025-11-27')
    }
  ];

  const createdInvoices = await Invoice.insertMany(invoices);
  console.log(`Created ${createdInvoices.length} invoices`);

  // Create payments for paid invoices
  const payments = [
    {
      invoice: createdInvoices[0]._id,
      amount: 5000,
      method: 'cash',
      paymentType: 'advance',
      receiptNo: 'RCPT-2025-0001',
      receivedBy: staffUser._id,
      date: new Date('2025-11-26'),
      note: 'Advance payment'
    },
    {
      invoice: createdInvoices[0]._id,
      amount: 15000,
      method: 'bank',
      paymentType: 'full',
      receiptNo: 'RCPT-2025-0002',
      receivedBy: staffUser._id,
      date: new Date('2025-11-26'),
      note: 'Final payment'
    },
    {
      invoice: createdInvoices[1]._id,
      amount: 25000,
      method: 'cash',
      paymentType: 'advance',
      receiptNo: 'RCPT-2025-0003',
      receivedBy: adminUser._id,
      date: new Date('2025-11-27'),
      note: 'Wedding package advance'
    }
  ];

  await Payment.insertMany(payments);
  console.log(`Created ${payments.length} payments`);

  // Update counters
  await Counter.updateOne({ name: 'invoice' }, { seq: 3 });
  await Counter.updateOne({ name: 'receipt' }, { seq: 3 });
}

async function seedExpenses(users) {
  console.log('Seeding expenses...');
  
  const adminUser = users.find(u => u.role === 'admin');
  
  const expenses = [
    {
      title: 'Studio Rent',
      amount: 45000,
      category: 'utilities',
      createdBy: adminUser._id,
      date: new Date('2025-11-01'),
      note: 'Monthly rent payment'
    },
    {
      title: 'Camera Equipment Maintenance',
      amount: 8500,
      category: 'maintenance',
      createdBy: adminUser._id,
      date: new Date('2025-11-15'),
      note: 'Lens cleaning and calibration'
    },
    {
      title: 'Photo Papers and Supplies',
      amount: 12000,
      category: 'supplies',
      createdBy: adminUser._id,
      date: new Date('2025-11-20'),
      note: 'Monthly supplies stock'
    },
    {
      title: 'Social Media Marketing',
      amount: 5000,
      category: 'marketing',
      createdBy: adminUser._id,
      date: new Date('2025-11-25'),
      note: 'Facebook and Instagram ads'
    }
  ];

  await Expense.insertMany(expenses);
  console.log(`Created ${expenses.length} expenses`);
}

async function main() {
  try {
    await connectDB();
    await clearDatabase();
    
    const users = await seedUsers();
    const customers = await seedCustomers();
    const frames = await seedFrames();
    await seedCounters();
    await seedInvoicesAndPayments(users, customers, frames);
    await seedExpenses(users);
    
    console.log('\n🌟 Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@shine.com / admin123');
    console.log('Staff: staff@shine.com / staff123');
    
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

main();