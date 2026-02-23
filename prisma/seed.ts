import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    CUSTOMER: 'customer',
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
    [ROLES.ADMIN]: [
        'products.read', 'products.write', 'products.delete',
        'inventory.read', 'inventory.write', 'inventory.adjust',
        'pos.access', 'pos.refund',
        'orders.read', 'orders.write', 'orders.cancel',
        'reports.view', 'reports.financial',
        'users.read', 'users.write', 'users.delete',
        'staff.read', 'staff.write', 'staff.salary',
        'expenses.read', 'expenses.write', 'expenses.approve',
        'suppliers.read', 'suppliers.write',
        'dashboard.view',
    ],
    [ROLES.MANAGER]: [
        'products.read', 'products.write',
        'inventory.read', 'inventory.write', 'inventory.adjust',
        'pos.access', 'pos.refund',
        'orders.read', 'orders.write', 'orders.cancel',
        'reports.view',
        'staff.read',
        'expenses.read', 'expenses.write',
        'suppliers.read', 'suppliers.write',
        'dashboard.view',
    ],
    [ROLES.STAFF]: [
        'products.read',
        'inventory.read',
        'pos.access',
        'orders.read', 'orders.write',
        'dashboard.view',
    ],
    [ROLES.CUSTOMER]: [
        'products.read',
        'orders.read',
    ],
};

// Helper: random date in range
function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
    console.log('🌱 Starting comprehensive database seed...\n');

    // ======================== ROLES ========================
    console.log('👤 Creating roles...');
    const roles: Record<string, { id: string }> = {};
    for (const [key, name] of Object.entries(ROLES)) {
        const role = await prisma.role.upsert({
            where: { name },
            update: { permissions: ROLE_PERMISSIONS[name] },
            create: {
                name,
                description: `${name.charAt(0).toUpperCase() + name.slice(1)} role`,
                permissions: ROLE_PERMISSIONS[name],
            },
        });
        roles[key] = role;
        console.log(`  ✓ Role: ${name}`);
    }

    // ======================== USERS ========================
    console.log('\n👥 Creating users...');
    const password = await bcrypt.hash('Admin@123', 12);
    const staffPassword = await bcrypt.hash('Staff@123', 12);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@shop.com' },
        update: {},
        create: {
            email: 'admin@shop.com',
            passwordHash: password,
            firstName: 'Havish',
            lastName: 'Gupta',
            phone: '9876543210',
            roleId: roles.ADMIN.id,
            isActive: true,
        },
    });
    console.log(`  ✓ Admin: ${admin.email}`);

    const manager = await prisma.user.upsert({
        where: { email: 'manager@shop.com' },
        update: {},
        create: {
            email: 'manager@shop.com',
            passwordHash: staffPassword,
            firstName: 'Ravi',
            lastName: 'Sharma',
            phone: '9876543211',
            roleId: roles.MANAGER.id,
            isActive: true,
        },
    });
    console.log(`  ✓ Manager: ${manager.email}`);

    const staff1 = await prisma.user.upsert({
        where: { email: 'staff1@shop.com' },
        update: {},
        create: {
            email: 'staff1@shop.com',
            passwordHash: staffPassword,
            firstName: 'Amit',
            lastName: 'Kumar',
            phone: '9876543212',
            roleId: roles.STAFF.id,
            isActive: true,
        },
    });
    console.log(`  ✓ Staff: ${staff1.email}`);

    const staff2 = await prisma.user.upsert({
        where: { email: 'staff2@shop.com' },
        update: {},
        create: {
            email: 'staff2@shop.com',
            passwordHash: staffPassword,
            firstName: 'Priya',
            lastName: 'Singh',
            phone: '9876543213',
            roleId: roles.STAFF.id,
            isActive: true,
        },
    });
    console.log(`  ✓ Staff: ${staff2.email}`);

    const staff3 = await prisma.user.upsert({
        where: { email: 'staff3@shop.com' },
        update: {},
        create: {
            email: 'staff3@shop.com',
            passwordHash: staffPassword,
            firstName: 'Suresh',
            lastName: 'Yadav',
            phone: '9876543214',
            roleId: roles.STAFF.id,
            isActive: false, // Inactive staff member
        },
    });
    console.log(`  ✓ Staff (inactive): ${staff3.email}`);

    const allStaff = [admin, manager, staff1, staff2, staff3];

    // ======================== INVENTORY LOCATIONS ========================
    console.log('\n📍 Creating inventory locations...');
    const mainWarehouse = await prisma.inventoryLocation.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Main Warehouse',
            description: 'Primary storage location',
            isActive: true,
        },
    });
    const shopFloor = await prisma.inventoryLocation.create({
        data: {
            name: 'Shop Floor Display',
            description: 'Products displayed on shop shelves',
            isActive: true,
        },
    }).catch(() => prisma.inventoryLocation.findFirst({ where: { name: 'Shop Floor Display' } }).then(loc => loc!));
    console.log(`  ✓ Locations: Main Warehouse, Shop Floor Display`);

    // ======================== PRODUCT CATEGORIES ========================
    console.log('\n📦 Creating product categories...');
    const categoryData = [
        { name: 'Dairy Products', description: 'Milk, cheese, butter, paneer, curd' },
        { name: 'Groceries', description: 'Rice, flour, dal, spices, oil' },
        { name: 'Beverages', description: 'Tea, coffee, juices, soft drinks' },
        { name: 'Snacks', description: 'Chips, biscuits, namkeen, chocolates' },
        { name: 'Personal Care', description: 'Soaps, shampoos, toothpaste' },
        { name: 'Household', description: 'Detergent, cleaning supplies' },
        { name: 'Fruits & Vegetables', description: 'Fresh produce' },
        { name: 'Bakery', description: 'Bread, cakes, pastries' },
    ];

    const categories: Record<string, { id: string }> = {};
    for (const cat of categoryData) {
        const c = await prisma.productCategory.create({
            data: { name: cat.name, description: cat.description, isActive: true },
        }).catch(async () => {
            const existing = await prisma.productCategory.findFirst({ where: { name: cat.name } });
            return existing!;
        });
        categories[cat.name] = c;
        console.log(`  ✓ Category: ${cat.name}`);
    }

    // ======================== PRODUCTS ========================
    console.log('\n🛒 Creating products...');
    const productData = [
        // Dairy
        { sku: 'DAIRY-001', name: 'Amul Taza Milk 500ml', categoryKey: 'Dairy Products', barcode: '8901030790100', purchasePrice: 25, sellingPrice: 30, mrp: 30, taxRate: 0, reorderLevel: 50, isPerishable: true, shelfLifeDays: 3, hsnCode: '0401' },
        { sku: 'DAIRY-002', name: 'Amul Gold Milk 1L', categoryKey: 'Dairy Products', barcode: '8901030790117', purchasePrice: 56, sellingPrice: 64, mrp: 64, taxRate: 0, reorderLevel: 40, isPerishable: true, shelfLifeDays: 3, hsnCode: '0401' },
        { sku: 'DAIRY-003', name: 'Amul Butter 500g', categoryKey: 'Dairy Products', barcode: '8901030790124', purchasePrice: 230, sellingPrice: 275, mrp: 280, taxRate: 12, reorderLevel: 15, isPerishable: true, shelfLifeDays: 60, hsnCode: '0405' },
        { sku: 'DAIRY-004', name: 'Mother Dairy Paneer 200g', categoryKey: 'Dairy Products', barcode: '8901030790131', purchasePrice: 75, sellingPrice: 90, mrp: 95, taxRate: 0, reorderLevel: 20, isPerishable: true, shelfLifeDays: 7, hsnCode: '0406' },
        { sku: 'DAIRY-005', name: 'Amul Curd 400g', categoryKey: 'Dairy Products', barcode: '8901030790148', purchasePrice: 38, sellingPrice: 45, mrp: 45, taxRate: 0, reorderLevel: 25, isPerishable: true, shelfLifeDays: 5, hsnCode: '0403' },

        // Groceries
        { sku: 'GRO-001', name: 'India Gate Basmati Rice 5kg', categoryKey: 'Groceries', barcode: '8901030790200', purchasePrice: 380, sellingPrice: 450, mrp: 470, taxRate: 5, reorderLevel: 10, isPerishable: false, hsnCode: '1006' },
        { sku: 'GRO-002', name: 'Aashirvaad Atta 10kg', categoryKey: 'Groceries', barcode: '8901030790217', purchasePrice: 350, sellingPrice: 410, mrp: 420, taxRate: 0, reorderLevel: 8, isPerishable: false, hsnCode: '1101' },
        { sku: 'GRO-003', name: 'Fortune Sunflower Oil 1L', categoryKey: 'Groceries', barcode: '8901030790224', purchasePrice: 130, sellingPrice: 155, mrp: 160, taxRate: 5, reorderLevel: 15, isPerishable: false, hsnCode: '1512' },
        { sku: 'GRO-004', name: 'Tata Salt 1kg', categoryKey: 'Groceries', barcode: '8901030790231', purchasePrice: 18, sellingPrice: 22, mrp: 24, taxRate: 0, reorderLevel: 30, isPerishable: false, hsnCode: '2501' },
        { sku: 'GRO-005', name: 'Toor Dal 1kg', categoryKey: 'Groceries', barcode: '8901030790248', purchasePrice: 120, sellingPrice: 145, mrp: 150, taxRate: 0, reorderLevel: 12, isPerishable: false, hsnCode: '0713' },
        { sku: 'GRO-006', name: 'MDH Garam Masala 100g', categoryKey: 'Groceries', barcode: '8901030790255', purchasePrice: 55, sellingPrice: 70, mrp: 75, taxRate: 5, reorderLevel: 20, isPerishable: false, hsnCode: '0910' },
        { sku: 'GRO-007', name: 'Sugar 1kg', categoryKey: 'Groceries', barcode: '8901030790262', purchasePrice: 38, sellingPrice: 45, mrp: 48, taxRate: 0, reorderLevel: 25, isPerishable: false, hsnCode: '1701' },

        // Beverages
        { sku: 'BEV-001', name: 'Tata Tea Gold 500g', categoryKey: 'Beverages', barcode: '8901030790300', purchasePrice: 200, sellingPrice: 240, mrp: 250, taxRate: 5, reorderLevel: 10, isPerishable: false, hsnCode: '0902' },
        { sku: 'BEV-002', name: 'Nescafe Classic 100g', categoryKey: 'Beverages', barcode: '8901030790317', purchasePrice: 220, sellingPrice: 260, mrp: 270, taxRate: 18, reorderLevel: 8, isPerishable: false, hsnCode: '2101' },
        { sku: 'BEV-003', name: 'Thums Up 750ml', categoryKey: 'Beverages', barcode: '8901030790324', purchasePrice: 32, sellingPrice: 40, mrp: 40, taxRate: 28, reorderLevel: 40, isPerishable: false, hsnCode: '2202' },
        { sku: 'BEV-004', name: 'Real Mango Juice 1L', categoryKey: 'Beverages', barcode: '8901030790331', purchasePrice: 75, sellingPrice: 95, mrp: 99, taxRate: 12, reorderLevel: 15, isPerishable: true, shelfLifeDays: 180, hsnCode: '2009' },

        // Snacks
        { sku: 'SNK-001', name: 'Lays Classic Salted 52g', categoryKey: 'Snacks', barcode: '8901030790400', purchasePrice: 16, sellingPrice: 20, mrp: 20, taxRate: 12, reorderLevel: 50, isPerishable: false, hsnCode: '2005' },
        { sku: 'SNK-002', name: 'Parle-G Biscuit 800g', categoryKey: 'Snacks', barcode: '8901030790417', purchasePrice: 70, sellingPrice: 85, mrp: 90, taxRate: 18, reorderLevel: 20, isPerishable: false, hsnCode: '1905' },
        { sku: 'SNK-003', name: 'Haldiram Bhujia 400g', categoryKey: 'Snacks', barcode: '8901030790424', purchasePrice: 110, sellingPrice: 135, mrp: 140, taxRate: 12, reorderLevel: 15, isPerishable: false, hsnCode: '2106' },
        { sku: 'SNK-004', name: 'Cadbury Dairy Milk 110g', categoryKey: 'Snacks', barcode: '8901030790431', purchasePrice: 78, sellingPrice: 100, mrp: 100, taxRate: 18, reorderLevel: 25, isPerishable: false, hsnCode: '1806' },

        // Personal Care
        { sku: 'PC-001', name: 'Dove Soap 100g', categoryKey: 'Personal Care', barcode: '8901030790500', purchasePrice: 42, sellingPrice: 55, mrp: 59, taxRate: 18, reorderLevel: 20, isPerishable: false, hsnCode: '3401' },
        { sku: 'PC-002', name: 'Head & Shoulders Shampoo 340ml', categoryKey: 'Personal Care', barcode: '8901030790517', purchasePrice: 280, sellingPrice: 340, mrp: 350, taxRate: 18, reorderLevel: 10, isPerishable: false, hsnCode: '3305' },
        { sku: 'PC-003', name: 'Colgate MaxFresh 150g', categoryKey: 'Personal Care', barcode: '8901030790524', purchasePrice: 85, sellingPrice: 105, mrp: 110, taxRate: 18, reorderLevel: 15, isPerishable: false, hsnCode: '3306' },

        // Household
        { sku: 'HH-001', name: 'Surf Excel Matic 2kg', categoryKey: 'Household', barcode: '8901030790600', purchasePrice: 320, sellingPrice: 390, mrp: 399, taxRate: 18, reorderLevel: 8, isPerishable: false, hsnCode: '3402' },
        { sku: 'HH-002', name: 'Vim Dishwash Bar 500g', categoryKey: 'Household', barcode: '8901030790617', purchasePrice: 35, sellingPrice: 44, mrp: 48, taxRate: 18, reorderLevel: 20, isPerishable: false, hsnCode: '3402' },
    ];

    const products: { id: string; sku: string; name: string; sellingPrice: number; purchasePrice: number; taxRate: number }[] = [];

    for (const p of productData) {
        const prod = await prisma.product.create({
            data: {
                sku: p.sku,
                name: p.name,
                hsnCode: p.hsnCode || null,
                barcode: p.barcode,
                categoryId: categories[p.categoryKey]?.id,
                purchasePrice: p.purchasePrice,
                sellingPrice: p.sellingPrice,
                mrp: p.mrp,
                taxRate: p.taxRate,
                reorderLevel: p.reorderLevel,
                isPerishable: p.isPerishable || false,
                shelfLifeDays: p.shelfLifeDays || null,
                isActive: true,
            },
        }).catch(async () => {
            const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
            return existing!;
        });
        products.push({ id: prod.id, sku: p.sku, name: p.name, sellingPrice: p.sellingPrice, purchasePrice: p.purchasePrice, taxRate: p.taxRate });
    }
    console.log(`  ✓ Created ${products.length} products`);

    // ======================== INVENTORY ITEMS ========================
    console.log('\n📊 Creating inventory items...');
    for (const p of products) {
        const qty = Math.floor(Math.random() * 80) + 10; // 10-90 units
        await prisma.inventoryItem.create({
            data: {
                productId: p.id,
                locationId: mainWarehouse.id,
                quantity: qty,
                availableQuantity: qty,
                status: 'available',
            },
        }).catch(() => { /* skip duplicates */ });
    }
    console.log(`  ✓ Inventory items created for ${products.length} products`);

    // ======================== SUPPLIERS ========================
    console.log('\n🏭 Creating suppliers...');
    const supplierData = [
        { name: 'Amul India Ltd.', contactName: 'Rajesh Patel', email: 'sales@amul.coop', phone: '1800-258-3333', address: 'Anand, Gujarat', gstNumber: '24AAACG1234A1Z5', panNumber: 'AAACG1234A', notes: 'Primary dairy supplier' },
        { name: 'ITC Limited', contactName: 'Sunita Mehta', email: 'fmcg@itc.in', phone: '033-2288-9371', address: 'Kolkata, West Bengal', gstNumber: '19AABCI4201G1ZB', panNumber: 'AABCI4201G', notes: 'Aashirvaad, Sunfeast supplier' },
        { name: 'Hindustan Unilever', contactName: 'Vikram Singh', email: 'partner@hul.co.in', phone: '022-3983-0000', address: 'Mumbai, Maharashtra', gstNumber: '27AAACH8119M1ZT', panNumber: 'AAACH8119M', notes: 'Personal care & home products' },
        { name: 'Parle Products', contactName: 'Amit Joshi', email: 'orders@parle.biz', phone: '022-2604-3939', address: 'Vile Parle, Mumbai', gstNumber: '27AAACP1234A1ZX', panNumber: 'AAACP1234A', notes: 'Biscuits and snacks' },
        { name: 'Tata Consumer Products', contactName: 'Neha Kapoor', email: 'b2b@tataconsumer.com', phone: '080-6764-0200', address: 'Bengaluru, Karnataka', gstNumber: '29AAACT5678B1Z9', panNumber: 'AAACT5678B', notes: 'Tea, salt, coffee' },
        { name: 'PepsiCo India', contactName: 'Rahul Verma', email: 'distributor@pepsico.com', phone: '0124-673-1000', address: 'Gurgaon, Haryana', gstNumber: '06AABCP9876D1ZQ', panNumber: 'AABCP9876D', notes: 'Lays, Kurkure, Tropicana' },
        { name: 'Local Fresh Produce', contactName: 'Kishan Lal', email: 'freshproduce@gmail.com', phone: '9998887776', address: 'APMC Market, Local', gstNumber: null, panNumber: null, notes: 'Fruits & vegetables daily supply' },
    ];

    const suppliers: { id: string; name: string }[] = [];
    for (const s of supplierData) {
        const sup = await prisma.supplier.create({
            data: s,
        }).catch(async () => {
            const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
            return existing!;
        });
        suppliers.push({ id: sup.id, name: s.name });
        console.log(`  ✓ Supplier: ${s.name}`);
    }

    // ======================== CUSTOMERS ========================
    console.log('\n🧑‍🤝‍🧑 Creating customers...');
    const customerData = [
        { name: 'Ramesh Agarwal', phone: '9111222333', email: 'ramesh@gmail.com', address: '12, MG Road, Indore', currentBalance: 450, creditLimit: 5000, notes: 'Regular monthly buyer' },
        { name: 'Sunita Devi', phone: '9222333444', email: null, address: '45, Nehru Nagar', currentBalance: 1200, creditLimit: 3000, notes: 'Weekly grocery customer' },
        { name: 'Mohan Lal Gupta', phone: '9333444555', email: 'mohan.gupta@yahoo.com', address: '78, Station Road', currentBalance: 0, creditLimit: 10000, notes: 'Wholesale buyer, owns restaurant' },
        { name: 'Aarti Sharma', phone: '9444555666', email: 'aarti.sharma@gmail.com', address: '23, Vijay Nagar', currentBalance: 2800, creditLimit: 3000, notes: 'Credit limit almost reached, follow up' },
        { name: 'Vikash Patel', phone: '9555666777', email: null, address: '56, Civil Lines', currentBalance: 0, creditLimit: 2000, notes: 'Cash customer mostly' },
        { name: 'Geeta Bai', phone: '9666777888', email: null, address: '89, Old City Market', currentBalance: 350, creditLimit: 1000, notes: 'Dairy products regular' },
        { name: 'Hotel Shree Krishna', phone: '9777888999', email: 'shreekrishna.hotel@gmail.com', address: '34, Main Road', currentBalance: 5500, creditLimit: 15000, notes: 'B2B - bulk daily orders' },
        { name: 'Anita Verma', phone: '9888999000', email: 'anita.v@gmail.com', address: '67, Green Park Colony', currentBalance: 0, creditLimit: 2000, notes: 'New customer' },
    ];

    const customers: { id: string; name: string }[] = [];
    for (const c of customerData) {
        const cust = await prisma.customer.create({
            data: c,
        }).catch(async () => {
            const existing = await prisma.customer.findFirst({ where: { phone: c.phone } });
            return existing!;
        });
        customers.push({ id: cust.id, name: c.name });
        console.log(`  ✓ Customer: ${c.name}`);
    }

    // ======================== EXPENSE CATEGORIES ========================
    console.log('\n💰 Creating expense categories...');
    const expenseCategoryNames = [
        'Salaries', 'Rent', 'Electricity Bill', 'Water Bill',
        'Internet/Phone Bill', 'Maintenance', 'Transportation',
        'Office Supplies', 'Packaging Materials', 'Miscellaneous',
    ];

    const expCategories: Record<string, { id: string }> = {};
    for (const name of expenseCategoryNames) {
        const ec = await prisma.expenseCategory.upsert({
            where: { name },
            update: {},
            create: { name, isActive: true },
        });
        expCategories[name] = ec;
    }
    console.log(`  ✓ Created ${expenseCategoryNames.length} expense categories`);

    // ======================== EXPENSES ========================
    console.log('\n💸 Creating sample expenses...');
    const expenseData = [
        { categoryKey: 'Rent', amount: 25000, description: 'Monthly shop rent - January 2026', vendor: 'Sharma Properties', paymentMethod: 'bank_transfer', status: 'approved', daysAgo: 30 },
        { categoryKey: 'Rent', amount: 25000, description: 'Monthly shop rent - February 2026', vendor: 'Sharma Properties', paymentMethod: 'bank_transfer', status: 'approved', daysAgo: 1 },
        { categoryKey: 'Electricity Bill', amount: 4500, description: 'Electricity bill January 2026', vendor: 'MP Electricity Board', paymentMethod: 'upi', status: 'approved', daysAgo: 25 },
        { categoryKey: 'Electricity Bill', amount: 5200, description: 'Electricity bill February 2026', vendor: 'MP Electricity Board', paymentMethod: 'upi', status: 'pending', daysAgo: 3 },
        { categoryKey: 'Salaries', amount: 15000, description: 'Salary - Amit Kumar (Jan)', vendor: null, paymentMethod: 'bank_transfer', status: 'approved', daysAgo: 28 },
        { categoryKey: 'Salaries', amount: 18000, description: 'Salary - Priya Singh (Jan)', vendor: null, paymentMethod: 'bank_transfer', status: 'approved', daysAgo: 28 },
        { categoryKey: 'Salaries', amount: 15000, description: 'Salary - Amit Kumar (Feb)', vendor: null, paymentMethod: 'bank_transfer', status: 'pending', daysAgo: 1 },
        { categoryKey: 'Transportation', amount: 2500, description: 'Delivery van fuel - week 1', vendor: 'Indian Oil Petrol Pump', paymentMethod: 'cash', status: 'approved', daysAgo: 14 },
        { categoryKey: 'Maintenance', amount: 3500, description: 'AC repair in store', vendor: 'CoolAir Services', paymentMethod: 'cash', status: 'approved', daysAgo: 10 },
        { categoryKey: 'Packaging Materials', amount: 1800, description: 'Carry bags and boxes', vendor: 'Sharma Plastics', paymentMethod: 'cash', status: 'approved', daysAgo: 7 },
        { categoryKey: 'Internet/Phone Bill', amount: 1200, description: 'Broadband & phone recharge', vendor: 'Jio', paymentMethod: 'upi', status: 'approved', daysAgo: 20 },
        { categoryKey: 'Miscellaneous', amount: 650, description: 'Tea & snacks for staff', vendor: null, paymentMethod: 'cash', status: 'approved', daysAgo: 5 },
    ];

    for (const e of expenseData) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() - e.daysAgo);
        await prisma.expense.create({
            data: {
                categoryId: expCategories[e.categoryKey]?.id,
                expenseDate: expDate,
                amount: e.amount,
                description: e.description,
                vendorName: e.vendor,
                paymentMethod: e.paymentMethod,
                status: e.status,
                createdBy: admin.id,
                approvedBy: e.status === 'approved' ? admin.id : null,
            },
        }).catch(() => { /* skip */ });
    }
    console.log(`  ✓ Created ${expenseData.length} expense records`);

    // ======================== PURCHASE ORDERS ========================
    console.log('\n📋 Creating purchase orders...');
    const po1 = await prisma.purchaseOrder.create({
        data: {
            poNumber: 'PO-001',
            supplierId: suppliers[0].id, // Amul
            orderDate: new Date('2026-02-01'),
            expectedDate: new Date('2026-02-05'),
            status: 'received',
            subtotal: 5000,
            taxAmount: 276,
            totalAmount: 5276,
            notes: 'Monthly dairy restock',
            createdBy: admin.id,
            items: {
                create: [
                    { productId: products[0].id, orderedQty: 100, receivedQty: 100, unitCost: 25, taxRate: 0, taxAmount: 0, totalCost: 2500 },
                    { productId: products[2].id, orderedQty: 10, receivedQty: 10, unitCost: 230, taxRate: 12, taxAmount: 276, totalCost: 2576 },
                ],
            },
        },
    }).catch(async () => prisma.purchaseOrder.findUnique({ where: { poNumber: 'PO-001' } }).then(p => p!));
    console.log('  ✓ PO-001: Amul dairy restock (received)');

    const po2 = await prisma.purchaseOrder.create({
        data: {
            poNumber: 'PO-002',
            supplierId: suppliers[1].id, // ITC
            orderDate: new Date('2026-02-10'),
            expectedDate: new Date('2026-02-15'),
            status: 'ordered',
            subtotal: 7600,
            taxAmount: 0,
            totalAmount: 7600,
            notes: 'Atta and grocery items',
            createdBy: admin.id,
            items: {
                create: [
                    { productId: products[6].id, orderedQty: 10, receivedQty: 0, unitCost: 350, taxRate: 0, taxAmount: 0, totalCost: 3500 },
                    { productId: products[11].id, orderedQty: 30, receivedQty: 0, unitCost: 38, taxRate: 0, taxAmount: 0, totalCost: 1140 },
                ],
            },
        },
    }).catch(async () => prisma.purchaseOrder.findUnique({ where: { poNumber: 'PO-002' } }).then(p => p!));
    console.log('  ✓ PO-002: ITC grocery items (ordered)');

    await prisma.purchaseOrder.create({
        data: {
            poNumber: 'PO-003',
            supplierId: suppliers[5].id, // PepsiCo
            orderDate: new Date('2026-02-15'),
            expectedDate: new Date('2026-02-20'),
            status: 'draft',
            subtotal: 3200,
            taxAmount: 384,
            totalAmount: 3584,
            notes: 'Snacks restock',
            createdBy: manager.id,
            items: {
                create: [
                    { productId: products[15].id, orderedQty: 200, receivedQty: 0, unitCost: 16, taxRate: 12, taxAmount: 384, totalCost: 3584 },
                ],
            },
        },
    }).catch(() => { /* skip */ });
    console.log('  ✓ PO-003: PepsiCo snacks (draft)');

    // ======================== SALES ORDERS ========================
    console.log('\n🧾 Creating sales orders...');
    const salesData = [
        {
            orderNumber: 'SO-001', customerId: customers[0].id, subtotal: 400, taxAmount: 0, totalAmount: 400,
            paymentStatus: 'paid', orderStatus: 'delivered', paymentMethod: 'cash', daysAgo: 5,
            items: [
                { productId: products[0].id, quantity: 5, unitPrice: 30, taxRate: 0, taxAmount: 0, discount: 0, totalPrice: 150 },
                { productId: products[5].id, quantity: 1, unitPrice: 250, taxRate: 0, taxAmount: 0, discount: 0, totalPrice: 250 },
            ],
        },
        {
            orderNumber: 'SO-002', customerId: customers[2].id, subtotal: 2000, taxAmount: 240, totalAmount: 2240,
            paymentStatus: 'paid', orderStatus: 'delivered', paymentMethod: 'upi', daysAgo: 4,
            items: [
                { productId: products[1].id, quantity: 10, unitPrice: 64, taxRate: 0, taxAmount: 0, discount: 0, totalPrice: 640 },
                { productId: products[12].id, quantity: 5, unitPrice: 240, taxRate: 5, taxAmount: 60, discount: 0, totalPrice: 1260 },
                { productId: products[14].id, quantity: 5, unitPrice: 40, taxRate: 28, taxAmount: 56, discount: 0, totalPrice: 256 },
            ],
        },
        {
            orderNumber: 'SO-003', customerId: customers[1].id, subtotal: 850, taxAmount: 0, totalAmount: 850,
            paymentStatus: 'pending', orderStatus: 'delivered', paymentMethod: 'credit', daysAgo: 3,
            items: [
                { productId: products[5].id, quantity: 1, unitPrice: 450, taxRate: 5, taxAmount: 22.5, discount: 0, totalPrice: 472.5 },
                { productId: products[9].id, quantity: 2, unitPrice: 145, taxRate: 0, taxAmount: 0, discount: 0, totalPrice: 290 },
            ],
        },
        {
            orderNumber: 'SO-004', customerId: null, subtotal: 275, taxAmount: 49.5, totalAmount: 324.5,
            paymentStatus: 'paid', orderStatus: 'delivered', paymentMethod: 'cash', daysAgo: 2,
            items: [
                { productId: products[2].id, quantity: 1, unitPrice: 275, taxRate: 12, taxAmount: 33, discount: 0, totalPrice: 308 },
            ],
        },
        {
            orderNumber: 'SO-005', customerId: customers[6].id, subtotal: 5200, taxAmount: 0, totalAmount: 5200,
            paymentStatus: 'paid', orderStatus: 'delivered', paymentMethod: 'bank_transfer', daysAgo: 1,
            items: [
                { productId: products[1].id, quantity: 40, unitPrice: 64, taxRate: 0, taxAmount: 0, discount: 0, totalPrice: 2560 },
                { productId: products[3].id, quantity: 20, unitPrice: 90, taxRate: 0, taxAmount: 0, discount: 0, totalPrice: 1800 },
                { productId: products[4].id, quantity: 20, unitPrice: 45, taxRate: 0, taxAmount: 0, discount: 0, totalPrice: 900 },
            ],
        },
    ];

    for (const sale of salesData) {
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - sale.daysAgo);
        await prisma.salesOrder.create({
            data: {
                orderNumber: sale.orderNumber,
                customerId: sale.customerId,
                orderType: 'pos',
                orderDate,
                subtotal: sale.subtotal,
                taxAmount: sale.taxAmount,
                totalAmount: sale.totalAmount,
                paymentStatus: sale.paymentStatus,
                orderStatus: sale.orderStatus,
                createdBy: staff1.id,
                items: {
                    create: sale.items,
                },
                payments: {
                    create: sale.paymentStatus === 'paid'
                        ? [{ amount: sale.totalAmount, paymentMethod: sale.paymentMethod, status: 'completed' }]
                        : [],
                },
            },
        }).catch(() => { /* skip duplicates */ });
        console.log(`  ✓ ${sale.orderNumber}: ₹${sale.totalAmount}`);
    }

    // ======================== ATTENDANCE ========================
    console.log('\n📅 Creating attendance records...');
    const activeStaff = [admin, manager, staff1, staff2];
    for (let d = 0; d < 14; d++) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        // Skip weekends (Sunday)
        if (date.getDay() === 0) continue;

        for (const user of activeStaff) {
            const checkIn = new Date(date);
            checkIn.setHours(9 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30), 0);
            const checkOut = new Date(date);
            checkOut.setHours(18 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30), 0);
            const workHours = ((checkOut.getTime() - checkIn.getTime()) / 3600000);
            const isLate = checkIn.getHours() >= 10;

            await prisma.attendance.create({
                data: {
                    userId: user.id,
                    date: date,
                    checkIn: checkIn,
                    checkOut: d === 0 ? null : checkOut, // Today: no checkout yet
                    status: isLate ? 'late' : 'present',
                    workHours: d === 0 ? null : parseFloat(workHours.toFixed(2)),
                    notes: isLate ? 'Arrived late' : null,
                },
            }).catch(() => { /* skip unique constraint violations */ });
        }
    }
    console.log(`  ✓ Created ~${14 * activeStaff.length} attendance records (2 weeks)`);

    // ======================== LEAVE REQUESTS ========================
    console.log('\n🏖️ Creating leave requests...');
    const leaveData = [
        { userId: staff1.id, startDate: '2026-02-25', endDate: '2026-02-26', type: 'casual', reason: 'Family function', status: 'approved', approvedBy: manager.id },
        { userId: staff2.id, startDate: '2026-03-01', endDate: '2026-03-03', type: 'sick', reason: 'Fever and cold', status: 'pending', approvedBy: null },
        { userId: staff1.id, startDate: '2026-01-26', endDate: '2026-01-26', type: 'casual', reason: 'Republic Day - personal', status: 'approved', approvedBy: admin.id },
        { userId: manager.id, startDate: '2026-03-10', endDate: '2026-03-14', type: 'annual', reason: 'Family vacation to Goa', status: 'pending', approvedBy: null },
        { userId: staff2.id, startDate: '2026-01-15', endDate: '2026-01-15', type: 'emergency', reason: 'Hospital emergency', status: 'approved', approvedBy: admin.id },
    ];

    for (const l of leaveData) {
        await prisma.leaveRequest.create({
            data: {
                userId: l.userId,
                startDate: new Date(l.startDate),
                endDate: new Date(l.endDate),
                type: l.type,
                reason: l.reason,
                status: l.status,
                approvedBy: l.approvedBy,
            },
        }).catch(() => { /* skip */ });
    }
    console.log(`  ✓ Created ${leaveData.length} leave requests`);

    // ======================== SYSTEM SETTINGS ========================
    console.log('\n⚙️ Creating system settings...');
    const settings = [
        { key: 'shop.name', value: 'Hoodal General Store' },
        { key: 'shop.address', value: '123, MG Road, Indore, MP 452001' },
        { key: 'shop.phone', value: '0731-2345678' },
        { key: 'shop.email', value: 'contact@hoodalstore.com' },
        { key: 'shop.gstNumber', value: '23ABCDE1234F1Z5' },
        { key: 'tax.defaultRate', value: '18' },
        { key: 'tax.enableGst', value: 'true' },
        { key: 'tax.defaultHsnCode', value: '8543' },
        { key: 'tax.includeGstInPrice', value: 'false' },
        { key: 'inventory.lowStockThreshold', value: '10' },
        { key: 'inventory.enableExpiryTracking', value: 'true' },
        { key: 'inventory.autoReorderEnabled', value: 'false' },
        { key: 'invoice.prefix', value: 'INV' },
        { key: 'invoice.nextNumber', value: '1006' },
        { key: 'invoice.termsAndConditions', value: 'Goods once sold will not be refunded. Exchange within 7 days with receipt.' },
        { key: 'invoice.footerNote', value: 'Thank you for shopping with us!' },
    ];

    for (const s of settings) {
        await prisma.systemSetting.upsert({
            where: { key: s.key },
            update: { value: s.value },
            create: { key: s.key, value: s.value },
        });
    }
    console.log(`  ✓ Created ${settings.length} system settings`);

    // ======================== REGISTER SESSIONS ========================
    console.log('\n💵 Creating register sessions...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(9, 0, 0, 0);
    const yesterdayClose = new Date(yesterday);
    yesterdayClose.setHours(20, 30, 0, 0);

    await prisma.registerSession.create({
        data: {
            registerName: 'Main Counter',
            openedBy: staff1.id,
            closedBy: staff1.id,
            openingCash: 2000,
            closingCash: 8750,
            expectedCash: 8500,
            variance: 250,
            totalSales: 12400,
            cashSales: 6500,
            cardSales: 2400,
            upiSales: 3000,
            creditSales: 500,
            transactionCount: 18,
            status: 'closed',
            openedAt: yesterday,
            closedAt: yesterdayClose,
            notes: 'Normal business day',
        },
    }).catch(() => { /* skip */ });

    const todayOpen = new Date();
    todayOpen.setHours(9, 15, 0, 0);
    await prisma.registerSession.create({
        data: {
            registerName: 'Main Counter',
            openedBy: staff1.id,
            openingCash: 2000,
            totalSales: 3200,
            cashSales: 1800,
            cardSales: 400,
            upiSales: 1000,
            creditSales: 0,
            transactionCount: 5,
            status: 'open',
            openedAt: todayOpen,
        },
    }).catch(() => { /* skip */ });
    console.log('  ✓ Created 2 register sessions (yesterday closed, today open)');

    // ======================== DONE ========================
    console.log('\n' + '='.repeat(60));
    console.log('✅ Comprehensive database seed completed successfully!');
    console.log('='.repeat(60));
    console.log('\nLogin credentials:');
    console.log('  👑 Admin   → admin@shop.com    / Admin@123');
    console.log('  👔 Manager → manager@shop.com  / Staff@123');
    console.log('  👷 Staff   → staff1@shop.com   / Staff@123');
    console.log('  👷 Staff   → staff2@shop.com   / Staff@123');
    console.log('\nData summary:');
    console.log(`  • ${Object.keys(roles).length} roles`);
    console.log(`  • ${allStaff.length} users`);
    console.log(`  • ${Object.keys(categories).length} product categories`);
    console.log(`  • ${products.length} products with inventory`);
    console.log(`  • ${suppliers.length} suppliers`);
    console.log(`  • ${customers.length} customers`);
    console.log(`  • ${expenseData.length} expenses`);
    console.log(`  • ${salesData.length} sales orders`);
    console.log(`  • ${leaveData.length} leave requests`);
    console.log(`  • ~${14 * activeStaff.length} attendance records`);
    console.log(`  • ${settings.length} system settings`);
    console.log(`  • 3 purchase orders`);
    console.log(`  • 2 register sessions`);
    console.log('');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
