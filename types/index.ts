export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  stock_quantity: number;
  images: string[];
  is_service: boolean;
  category?: string;
  subcategory?: string;
  brand?: string;
  created_at?: string;
}

export interface CartItem extends Product {
  cartQuantity: number;
  selectedAddons?: string[];
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  payment_status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  order_status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  paystack_reference: string;
  shipping_address: string;
  installation_notes?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  phone_number: string;
  address: string;
  role: 'customer' | 'admin';
  created_at: string;
}
