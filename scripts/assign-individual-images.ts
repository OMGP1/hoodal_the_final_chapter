/**
 * Script to assign INDIVIDUAL product images to existing products.
 * Run: npx ts-node scripts/assign-individual-images.ts
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
    // Snacks (keep category image for ones not generated)
    'SNK-001': '/uploads/products/lays_classic.png',
    'SNK-002': '/uploads/products/snacks.png',       // Parle-G — category fallback
    'SNK-003': '/uploads/products/snacks.png',       // Haldiram — category fallback
    'SNK-004': '/uploads/products/snacks.png',       // Cadbury — category fallback
    // Personal Care (keep category images)
    'PC-001': '/uploads/products/personal_care.png',
    'PC-002': '/uploads/products/personal_care.png',
    'PC-003': '/uploads/products/personal_care.png',
    // Household (keep category images)
    'HH-001': '/uploads/products/household.png',
    'HH-002': '/uploads/products/household.png',
};

async function main() {
    console.log('🖼️  Assigning individual images to products...\n');

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
