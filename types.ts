export enum UserRole {
  NORMAL = 'NORMAL',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP',
  ADMIN = 'ADMIN'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  age: number;
  gender: 'Male' | 'Female';
  education: string;
  profession: string;
  location: string;
  caste: 'Brahmin';
  sub_caste: string;
  bio: string;
  photo_url?: string;
  created_at: string;
  // Hydrated fields for UI (may be masked by backend)
  contact_email?: string;
  contact_phone?: string;
  is_contact_masked?: boolean; 
}

export interface Payment {
  id: string;
  user_id: string;
  user_name?: string; // For admin view
  plan: 'PREMIUM' | 'VIP';
  upi_txn_id: string;
  screenshot_url: string;
  status: PaymentStatus;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
}