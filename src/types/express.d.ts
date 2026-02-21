import { User, Role } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: string;
    permissions: string[];
}

export type UserWithRole = User & {
    role: Role | null;
};

export { };
