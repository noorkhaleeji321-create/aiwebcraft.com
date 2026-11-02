export interface Product {
  id: number;
  uuid: string;
  name: string;
  name_ar: string;
  slug: string;
  description: string;
  description_ar: string;
  price: number;
  promo_price: number | null;
  category_id: number;
  category_name?: string;
  sku: string;
  stock_quantity: number;
  is_published: boolean;
  is_featured: boolean;
  attributes_json: string; // JSON: { color?: string, size?: string, weight?: string, material?: string }
  images?: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  alt_text: string;
  display_order: number;
  is_primary: boolean;
  file_size_bytes: number;
  width: number;
  height: number;
  format: string;
  sha256_hash: string;
}

export interface Category {
  id: number;
  name: string;
  name_ar: string;
  slug: string;
  parent_id: number | null;
  description: string;
  icon: string;
  sort_order: number;
  product_count?: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  title: string;
  sku: string;
  price: number;
  stock_quantity: number;
  option_values_json: string;
}

export interface InventoryRecord {
  id: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  variant_id: number | null;
  location: string;
  quantity: number;
  low_stock_threshold: number;
  updated_at: string;
}

export interface Customer {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_region?: string;
  postal_code?: string;
  country: string;
  notes?: string;
  total_orders?: number;
  total_spent?: number;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: string;
  city: string;
  postal_code: string;
  total_amount: number;
  currency: string;
  payment_method: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  notes: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface StoreSetting {
  key: string;
  value: string;
  category: 'general' | 'localization' | 'shipping' | 'security' | 'api';
  updated_at: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: 'owner' | 'manager';
  two_factor_enabled: boolean;
  last_login: string;
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  action_type: 'AUTH' | 'PRODUCT_CREATE' | 'PRODUCT_UPDATE' | 'PRODUCT_DELETE' | 'ORDER_RECEIVED' | 'ORDER_STATUS' | 'MEDIA_UPLOAD' | 'MEDIA_DELETE' | 'SQL_QUERY' | 'BACKUP_EXPORT' | 'RESTORE_APPLY' | 'API_REQUEST';
  entity_type: string;
  entity_id: string;
  actor: string;
  details: string;
  ip_address: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  token_hash: string;
  permissions: ('read:products' | 'write:orders' | 'read:orders' | 'admin:catalog')[];
  last_used_at: string | null;
  created_at: string;
  status: 'active' | 'revoked';
}

export interface StoredMediaFile {
  id: string;
  filename: string;
  url: string;
  thumbnail_url: string;
  mime_type: string;
  size_bytes: number;
  width: number;
  height: number;
  sha256: string;
  uploaded_at: string;
  used_in_product_ids: number[];
}

export interface StorageQuota {
  d1_rows_read_today: number;
  d1_rows_read_limit: number;
  d1_rows_written_today: number;
  d1_rows_written_limit: number;
  d1_storage_bytes: number;
  d1_storage_limit_bytes: number;
  r2_storage_bytes: number;
  r2_storage_limit_bytes: number;
  r2_class_a_ops: number;
  r2_class_a_limit: number;
  r2_class_b_ops: number;
  r2_class_b_limit: number;
}
