import { User as FirebaseUser } from 'firebase/auth';

export type ProductType = 'music' | 'script' | 'website' | 'webapp' | 'software' | 'data' | 'security' | 'ai' | 'service' | 'linux' | 'visual' | 'other';

export type SubscriptionPlan = 'free' | 'pro' | 'premium';

export interface User extends FirebaseUser {}

export interface Product {
  id: string;
  created_at: string;
  updated_at?: string;
  title: string;
  category?: string;
  description: string;
  price: number;
  type: ProductType;
  file_url: string;
  thumbnail_url?: string;
  image_urls: string[];
  video_url?: string;
  youtube_url?: string;
  live_demo_url?: string;
  features?: string[];
  tags?: string[];
  license_type?: string;
  update_history?: { version: string; date: string; notes: string }[];
  seller_email?: string;
  seller_telegram?: string;
  seller_discord?: string;
  creator_id: string;
  status?: 'Listed' | 'Sold' | 'Archived' | 'Processing';
  metadata: {
    version: string;
    file_size: string;
    sha256?: string;
    tech_stack: string[];
  };
  creator?: Profile;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  email: string;
  role: 'merchant' | 'buyer';
  bio?: string;
  verification_badge?: boolean;
  rating?: number;
  joined_date?: string;
  subscription_plan?: SubscriptionPlan;
  product_limit?: number;
  featured_listings_count?: number;
  response_time?: string;
  upi_id?: string;
  crypto_address?: string;
  crypto_network?: string;
  paypal_email?: string;
  bank_details?: string;
  subscription_expires_at?: string;
  nowpayments_api_key?: string;
}

export interface AppSettings {
  site_name: string;
  commission_rate: number;
  commission_mode: boolean;
  maintenance_mode: boolean;
  subscription_mode: boolean;
  plans: {
    pro: { price: number; features: string[] };
    premium: { price: number; features: string[] };
  };
  global_discount: number; // 0 to 100
}

export interface Order {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  status: 'pending' | 'payment_sent' | 'released' | 'completed' | 'failed';
  amount: number;
  commission: number; // 5% commission
  payment_method?: 'upi' | 'crypto' | 'paypal' | 'bank';
  payment_proof?: string;
  created_at: string;
  product?: Product;
  buyer?: Profile;
}

export interface Job {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget: number;
  category: ProductType | string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  client?: Profile;
}

export interface JobApplication {
  id: string;
  job_id: string;
  developer_id: string;
  client_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'paid';
  created_at: string;
  job?: Job;
  developer?: Profile;
  client?: Profile;
  file_url?: string;
  deliverables?: {
    preview_url?: string;
    final_files_url?: string;
    credentials?: string;
  };
}

export interface Message {
  id: string;
  application_id?: string;
  conversation_id?: string;
  sender_id: string;
  text: string;
  file_url?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  last_message?: string;
  last_message_at?: string;
  product_id?: string;
  unread_count?: Record<string, number>;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url: string;
  };
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  details: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'payout' | 'system' | 'message' | 'announcement';
  read: boolean;
  created_at: string;
}

export interface TicketReply {
  senderId: string;
  message: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  category: 'support' | 'billing' | 'report' | 'technical' | 'security';
  status: 'open' | 'closed';
  created_at: string;
  attachment_url?: string | null;
  replies?: TicketReply[];
  user?: Profile;
}
