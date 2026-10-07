export type UserRole = 'USER' | 'DRIVER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  rating?: number;
  totalRides?: number;
  isOnline?: boolean;
}
