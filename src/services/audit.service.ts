import { prisma } from '../config/database';

export class AuditService {
    async getLogs(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.auditLog.count(),
        ]);

        return {
            logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

export const auditService = new AuditService();
