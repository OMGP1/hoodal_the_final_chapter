const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        where: { name: { in: ['Test Product', 'Vim Dishwash Bar 500g', 'Ariel Matic 2kg'] } },
        include: { inventoryItems: true }
    });
    console.log(JSON.stringify(products, null, 2));
    await prisma.$disconnect();
}
main();
