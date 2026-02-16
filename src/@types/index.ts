export interface RegisterInput {
  email: string;
}

export interface VerifyInput {
  userId: string;
  fullName: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface GoogleLoginInput {
  email: string;
  name: string;
  googleId: string;
  avatarUrl?: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  email?: string;
  avatarUrl?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface CreateAddressInput {
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  isPrimary?: boolean;
}