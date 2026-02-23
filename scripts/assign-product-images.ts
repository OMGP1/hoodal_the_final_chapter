/**
 * Script to assign product images to existing products.
 * Uses category-based images stored in uploads/products/
 * Run: npx ts-node scripts/assign-product-images.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map SKU prefix → image filename
const SKU_IMAGE_MAP: Record<string, string> = {
    'DAIRY': '/uploads/products/dairy.png',
    'GRO': '/uploads/products/grocery.png',
    'BEV': '/uploads/products/beverage.png',
    'SNK': '/uploads/products/snacks.png',
    'PC': '/uploads/products/personal_care.png',
    'HH': '/uploads/products/household.png',
};

async function main() {
    console.log('🖼️  Assigning images to products...\n');

    const products = await prisma.product.findMany({
        select: { id: true, sku: true, name: true, imageUrl: true },
    });

    let updated = 0;

    for (const product of products) {
        // Find matching image based on SKU prefix
        const prefix = product.sku.split('-')[0];
        const imageUrl = SKU_IMAGE_MAP[prefix];

        if (imageUrl && product.imageUrl !== imageUrl) {
            await prisma.product.update({
                where: { id: product.id },
                data: { imageUrl },
            });
            updated++;
            console.log(`  ✓ ${product.name} → ${imageUrl}`);
        } else if (!imageUrl) {
            console.log(`  ⚠ No image mapping for ${product.sku} (${product.name})`);
        } else {
            console.log(`  ⏭ ${product.name} already has image`);
        }
    }

    console.log(`\n✅ Updated ${updated}/${products.length} products with images.`);
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error('Error:', e);
    prisma.$disconnect();
    process.exit(1);
});
