import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find all categories
    const cats = await prisma.productCategory.findMany({
        select: { id: true, name: true, _count: { select: { products: true } } },
        orderBy: { name: 'asc' },
    });

    console.log('Current categories:');
    cats.forEach(c => console.log(`  ${c.name} (${c.id}) — ${c._count.products} products`));

    // Find duplicates
    const nameMap = new Map<string, typeof cats>();
    for (const cat of cats) {
        const existing = nameMap.get(cat.name) || [];
        existing.push(cat);
        nameMap.set(cat.name, existing);
    }

    for (const [name, dupes] of nameMap) {
        if (dupes.length <= 1) continue;

        console.log(`\n⚠ Duplicate: "${name}" (${dupes.length} entries)`);

        // Keep the one with the most products
        dupes.sort((a, b) => b._count.products - a._count.products);
        const keep = dupes[0];
        const toDelete = dupes.slice(1);

        console.log(`  ✓ Keeping: ${keep.id} (${keep._count.products} products)`);

        for (const dup of toDelete) {
            // Reassign any products from the duplicate to the kept category
            if (dup._count.products > 0) {
                await prisma.product.updateMany({
                    where: { categoryId: dup.id },
                    data: { categoryId: keep.id },
                });
                console.log(`  → Moved ${dup._count.products} products from ${dup.id} to ${keep.id}`);
            }

            // Delete the duplicate
            await prisma.productCategory.delete({ where: { id: dup.id } });
            console.log(`  ✗ Deleted: ${dup.id} (${dup._count.products} products)`);
        }
    }

    console.log('\n✅ Done! Duplicates removed.');
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
