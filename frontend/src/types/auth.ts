export interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    roleId: string | null;
    role: string | null; // Backend sends role name as string
    isActive: boolean;
    lastLogin: string | null;
    createdAt: string;
    updatedAt: string;
    permissions?: string[];
}

export interface Role {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

// Backend response format: { user, tokens }
export interface LoginResponse {
    user: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: string;
    };
    tokens: AuthTokens;
}

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}
