"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    CUSTOMER: 'customer',
};
const ROLE_PERMISSIONS = {
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
async function main() {
    console.log('🌱 Starting database seed...\n');
    // Create roles
    console.log('Creating roles...');
    const roles = {};
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
        console.log(`  ✓ Created role: ${name}`);
    }
    // Create admin user
    console.log('\nCreating admin user...');
    const adminPassword = await bcrypt_1.default.hash('Admin@123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@shop.com' },
        update: {},
        create: {
            email: 'admin@shop.com',
            passwordHash: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            roleId: roles.ADMIN.id,
            isActive: true,
        },
    });
    console.log(`  ✓ Created admin user: ${admin.email} (password: Admin@123)`);
    // Create default inventory location
    console.log('\nCreating default inventory location...');
    const location = await prisma.inventoryLocation.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Main Warehouse',
            description: 'Primary storage location',
            isActive: true,
        },
    });
    console.log(`  ✓ Created location: ${location.name}`);
    // Create expense categories
    console.log('\nCreating expense categories...');
    const expenseCategories = [
        'Salaries',
        'Rent',
        'Electricity Bill',
        'Water Bill',
        'Internet/Phone Bill',
        'Maintenance',
        'Transportation',
        'Office Supplies',
        'Miscellaneous',
    ];
    for (const name of expenseCategories) {
        await prisma.expenseCategory.upsert({
            where: { name },
            update: {},
            create: { name, isActive: true },
        });
        console.log(`  ✓ Created expense category: ${name}`);
    }
    // Create sample product categories
    console.log('\nCreating sample product categories...');
    const categories = [
        { name: 'Dairy Products', description: 'Milk, cheese, butter, etc.' },
        { name: 'Groceries', description: 'Rice, flour, spices, etc.' },
        { name: 'Beverages', description: 'Drinks and refreshments' },
        { name: 'Snacks', description: 'Chips, biscuits, etc.' },
        { name: 'Personal Care', description: 'Soaps, shampoos, etc.' },
    ];
    for (const cat of categories) {
        await prisma.productCategory.upsert({
            where: { id: cat.name.toLowerCase().replace(' ', '-') + '-id' },
            update: {},
            create: {
                name: cat.name,
                description: cat.description,
                isActive: true,
            },
        });
        console.log(`  ✓ Created category: ${cat.name}`);
    }
    console.log('\n✅ Database seed completed successfully!\n');
    console.log('You can now login with:');
    console.log('  Email: admin@shop.com');
    console.log('  Password: Admin@123\n');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map