import { collection, addDoc, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { 
  Branch, 
  Employee, 
  Client, 
  InventoryItem, 
  Account, 
  Order, 
  Transaction, 
  FinancialDocument,
  OrderWorkflowStatus
} from '../types';

const SEED_BRANCHES: Partial<Branch>[] = [
  { name: 'Imperial Headquarters', location: 'Gulberg III, Lahore', phone: '+92 42 3571XXXX' }
];

const SEED_ACCOUNTS: Partial<Account>[] = [
  { code: '1001', name: 'Petty Cash', type: 'asset', balance: 50000 },
  { code: '1002', name: 'Bank - Al-Falah', type: 'asset', balance: 250000 },
  { code: '4001', name: 'Sales Revenue', type: 'revenue', balance: 0 },
  { code: '5001', name: 'Payroll Expense', type: 'expense', balance: 0 },
  { code: '5002', name: 'Utility Expense', type: 'expense', balance: 0 },
  { code: '1003', name: 'Fabric Inventory', type: 'asset', balance: 120000 }
];

const SEED_EMPLOYEES: Partial<Employee>[] = [
  { name: 'Master Saleem', role: 'Head Cutter', salary: 85000, phone: '03001234567', joinedAt: new Date().toISOString() },
  { name: 'Zahid Tailor', role: 'Stitcher', salary: 45000, phone: '03007654321', joinedAt: new Date().toISOString() },
  { name: 'Irfan Helper', role: 'Finishing Specialist', salary: 30000, phone: '03001112223', joinedAt: new Date().toISOString() }
];

const SEED_CLIENTS: Partial<Client>[] = [
  { 
    name: 'Mian Saleem Ayoub', 
    phone: '0321844XXXX', 
    email: 'saleem@example.com', 
    address: 'Defense Phase 5', 
    measurements: { neck: 15.5, chest: 42, waist: 36, shoulder: 18, sleeve: 24, length: 40 },
    createdAt: new Date().toISOString()
  },
  { 
    name: 'Chaudhry Pervaiz', 
    phone: '0301445XXXX', 
    address: 'Cavalry Ground', 
    measurements: { neck: 16, chest: 44, waist: 40, shoulder: 19, sleeve: 25, length: 42 },
    createdAt: new Date().toISOString()
  }
];

const SEED_INVENTORY: Partial<InventoryItem>[] = [
  { name: 'Wash & Wear - Cream', category: 'Fabric', quantity: 45, unit: 'meters', minLevel: 10, pricePerUnit: 850, isRollTracked: true, lastUpdated: new Date().toISOString() },
  { name: 'Latha - White', category: 'Fabric', quantity: 120, unit: 'meters', minLevel: 20, pricePerUnit: 650, isRollTracked: true, lastUpdated: new Date().toISOString() },
  { name: 'German Interlining', category: 'Notions', quantity: 5, unit: 'pieces', minLevel: 10, pricePerUnit: 450, isRollTracked: false, lastUpdated: new Date().toISOString() }
];

export async function seedDatabase() {
  console.log('Starting seed process...');
  
  try {
    const branchesRef = collection(db, 'branches');
    const branchIds: string[] = [];
    for (const b of SEED_BRANCHES) {
      const docRef = await addDoc(branchesRef, b);
      branchIds.push(docRef.id);
    }

    const accountsRef = collection(db, 'accounts');
    const accountMap: Record<string, string> = {};
    for (const a of SEED_ACCOUNTS) {
      const docRef = await addDoc(accountsRef, a);
      accountMap[a.name!] = docRef.id;
    }

    const empRef = collection(db, 'employees');
    const empIds: string[] = [];
    for (const e of SEED_EMPLOYEES) {
      const docRef = await addDoc(empRef, e);
      empIds.push(docRef.id);
    }

    const clientsRef = collection(db, 'clients');
    const clientIds: string[] = [];
    for (const c of SEED_CLIENTS) {
      const docRef = await addDoc(clientsRef, c);
      clientIds.push(docRef.id);
    }

    const invRef = collection(db, 'inventory');
    for (const i of SEED_INVENTORY) {
      await addDoc(invRef, i);
    }

    // Seed some orders
    const ordersRef = collection(db, 'orders');
    const txnRef = collection(db, 'transactions');
    const docRefFin = collection(db, 'financialDocuments');
    
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);

    const sampleOrders: Partial<Order>[] = [
      {
        clientId: clientIds[0],
        clientName: SEED_CLIENTS[0].name,
        branchId: branchIds[0],
        status: 'in-progress',
        totalAmount: 12500,
        paidAmount: 5000,
        advancePayment: 5000,
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        items: [
          { id: 'item1', type: 'Shalwar Kameez', description: 'Cream Wash & Wear', price: 12500, status: 'stitching', dueDate: now.toISOString(), measurements: SEED_CLIENTS[0].measurements as any }
        ],
        auditTrail: []
      },
      {
        clientId: clientIds[1],
        clientName: SEED_CLIENTS[1].name,
        branchId: branchIds[0],
        status: 'ready',
        totalAmount: 25000,
        paidAmount: 25000,
        advancePayment: 10000,
        dueDate: now.toISOString(),
        createdAt: lastMonth.toISOString(),
        updatedAt: now.toISOString(),
        items: [
          { id: 'item2', type: 'Sherwani', description: 'Black Heavy Embroidered', price: 25000, status: 'ready', dueDate: now.toISOString(), measurements: SEED_CLIENTS[1].measurements as any }
        ],
        auditTrail: []
      }
    ];

    for (const o of sampleOrders) {
      const orderDoc = await addDoc(ordersRef, o);
      
      // Add transactions for these orders
      if (o.paidAmount! > 0) {
        await addDoc(txnRef, {
          date: o.createdAt,
          description: `Advance for Order ${orderDoc.id}`,
          amount: o.paidAmount,
          debitAccountId: accountMap['Petty Cash'],
          creditAccountId: accountMap['Sales Revenue'],
          type: 'sale',
          reference: orderDoc.id
        });

        await addDoc(docRefFin, {
          type: 'receipt',
          clientId: o.clientId,
          clientName: o.clientName,
          orderId: orderDoc.id,
          amount: o.paidAmount,
          date: o.createdAt,
          status: 'paid',
          createdAt: o.createdAt,
          createdBy: 'system-seeder',
          auditTrail: []
        });
      }
    }

    // Add some historical transactions for the chart
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      const isoDate = date.toISOString();
      
      await addDoc(txnRef, {
        date: isoDate,
        description: `Monthly Sales Performance - ${date.toLocaleString('default', { month: 'long' })}`,
        amount: 50000 + Math.random() * 100000,
        debitAccountId: accountMap['Bank - Al-Falah'],
        creditAccountId: accountMap['Sales Revenue'],
        type: 'sale'
      });

      await addDoc(txnRef, {
        date: isoDate,
        description: `Payroll Disbursal - ${date.toLocaleString('default', { month: 'long' })}`,
        amount: 35000 + Math.random() * 20000,
        debitAccountId: accountMap['Payroll Expense'],
        creditAccountId: accountMap['Bank - Al-Falah'],
        type: 'payroll'
      });
    }

    console.log('Seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}
