/**
 * Script to assign final individual product images.
 * Run: npx ts-node scripts/assign-final-images.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map SKU → individual image filename
const SKU_IMAGE_MAP: Record<string, string> = {
    // Dairy
    'DAIRY-001': '/uploads/products/amul_taza_milk.png',
    'DAIRY-002': '/uploads/products/amul_gold_milk.png',
    'DAIRY-003': '/uploads/products/amul_butter.png',
    'DAIRY-004': '/uploads/products/mother_dairy_paneer.png',
    'DAIRY-005': '/uploads/products/amul_curd.png',
    // Groceries
    'GRO-001': '/uploads/products/india_gate_rice.png',
    'GRO-002': '/uploads/products/aashirvaad_atta.png',
    'GRO-003': '/uploads/products/fortune_oil.png',
    'GRO-004': '/uploads/products/tata_salt.png',
    'GRO-005': '/uploads/products/toor_dal.png',
    'GRO-006': '/uploads/products/mdh_garam_masala.png',
    'GRO-007': '/uploads/products/sugar_pack.png',
    // Beverages
    'BEV-001': '/uploads/products/tata_tea_gold.png',
    'BEV-002': '/uploads/products/nescafe_classic.png',
    'BEV-003': '/uploads/products/thums_up.png',
    'BEV-004': '/uploads/products/real_mango_juice.png',
    // Snacks
    'SNK-001': '/uploads/products/lays_classic.png',
    'SNK-002': '/uploads/products/parle_g.jpg',
    'SNK-003': '/uploads/products/haldiram_bhujia.jpg',
    'SNK-004': '/uploads/products/cadbury_dairy_milk.jpg',
    // Personal Care
    'PC-001': '/uploads/products/dove_soap.jpg',
    'PC-002': '/uploads/products/head_shoulders.jpg',
    'PC-003': '/uploads/products/colgate_maxfresh.jpg',
    // Household
    'HH-001': '/uploads/products/surf_excel.jpg',
    'HH-002': '/uploads/products/household.png', // Vim keeps category image
};

async function main() {
    console.log('🖼️  Assigning final individual images to products...\n');

    const products = await prisma.product.findMany({
        select: { id: true, sku: true, name: true, imageUrl: true },
    });

    let updated = 0;

    for (const product of products) {
        const imageUrl = SKU_IMAGE_MAP[product.sku];

        if (imageUrl && product.imageUrl !== imageUrl) {
            await prisma.product.update({
                where: { id: product.id },
                data: { imageUrl },
            });
            updated++;
            console.log(`  ✓ ${product.name} → ${imageUrl}`);
        } else if (!imageUrl) {
            console.log(`  ⏭ ${product.sku} (${product.name}) — no mapping`);
        } else {
            console.log(`  ⏭ ${product.name} — already set`);
        }
    }

    console.log(`\n✅ Updated ${updated}/${products.length} products.`);
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error('Error:', e);
    process.exit(1);
});
