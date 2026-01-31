export interface RegisterInput {
    email: string;
}

export interface VerifyInput {
    token: string;
    fullName: string;
    password: string;
}

export interface JWTPayload {
    userId: string;
    email: string;
}