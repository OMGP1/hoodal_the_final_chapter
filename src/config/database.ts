import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: env.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
    });

if (!env.isProduction) {
    globalForPrisma.prisma = prisma;
}

export default prisma;
