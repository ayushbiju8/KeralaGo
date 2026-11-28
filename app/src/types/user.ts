export type UserRole = 'USER' | 'DRIVER' | 'ADMIN';
export type UserGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gender?: UserGender;
  role: UserRole;
  avatar?: string;
  rating?: number;
  totalRides?: number;
  isOnline?: boolean;
  defaultPaymentMethod?: string;
}

