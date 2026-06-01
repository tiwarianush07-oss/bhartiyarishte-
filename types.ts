
export interface User {
  id: string;
  email: string;
  phone_number?: string;
  is_admin: boolean;
  is_suspended: boolean;
  is_premium?: boolean;
  role: 'user' | 'admin';
  deleted_at?: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  age?: number;
  height: string;
  religion: string;
  caste: string;
  sub_caste?: string;
  city: string;
  state: string;
  current_address?: string;
  education: string;
  profession: string;
  time_of_birth?: string;
  place_of_birth?: string;
  income_rs?: string;
  fathers_occupation?: string;
  mothers_occupation?: string;
  brothers?: string;
  sisters?: string;
  marital_status: string;
  bio: string;
  user_display_id?: string;
  is_approved: boolean;
  is_admin?: boolean;
  is_verified?: boolean;
  profile_completed?: boolean;
  avatar_url?: string;
  id_card_url?: string;
  gallery_urls?: string[];
  created_at: string;
  phone_number?: string;
  mother_tongue?: string;
  occupation?: string;
  annual_income?: string;
  address?: string;
  role?: 'user' | 'admin';
  plan_type?: 'free' | 'premium';
  partner_preferences?: Record<string, any>;
  verification_status?: 'pending' | 'verified' | 'unverified' | null;
}

export interface Photo {
  id: string;
  user_id: string;
  url: string;
  is_primary: boolean;
}

export interface Shortlist {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  deleted_for_sender: boolean;
  deleted_for_receiver: boolean;
}

export interface ChatParticipant {
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
}

export interface ChatConversation {
  id: string;
  other_participant: Profile;
  last_message: ChatMessage | null;
  unread_count: number;
}

