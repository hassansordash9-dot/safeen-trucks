export type UserRole = 'user' | 'dealer' | 'admin';
export type UserStatus = 'active' | 'warned' | 'suspended' | 'banned';
export type ListingStatus =
  | 'draft'
  | 'pending'
  | 'published'
  | 'rejected'
  | 'paused'
  | 'sold'
  | 'expired';
export type ListingKind = 'truck' | 'part';
export type CurrencyCode = 'USD' | 'IQD';
export type TruckCondition = 'new' | 'used';
export type PartCondition = 'new' | 'used' | 'rebuilt';
export type PartType = 'original' | 'aftermarket';
export type TransmissionType = 'manual' | 'automatic' | 'semi_automatic';
export type VerificationLevel = 'phone' | 'identity' | 'business' | 'safin_dealer';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type ReportReason =
  | 'fake'
  | 'scam'
  | 'wrong_price'
  | 'wrong_info'
  | 'sold'
  | 'duplicate'
  | 'other';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';
export type ContactEventType = 'view' | 'whatsapp' | 'call' | 'favorite';

export const TRANSMISSIONS: TransmissionType[] = ['manual', 'automatic', 'semi_automatic'];
export const AXLE_CONFIGURATIONS = ['4x2', '4x4', '6x2', '6x4', '8x2', '8x4'] as const;
export const EMISSION_CLASSES = ['Euro 2', 'Euro 3', 'Euro 4', 'Euro 5', 'Euro 6'] as const;
export const CURRENCIES: CurrencyCode[] = ['USD', 'IQD'];

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  locale: string;
  location_id: string | null;
  created_at: string;
};

export type LocationRow = {
  id: string;
  country_code: string;
  governorate: string;
  slug: string;
  name_en: string;
  name_ku: string;
  name_ar: string;
};

export type TruckBrand = { id: string; slug: string; name: string; logo_url: string | null };
export type TruckModel = { id: string; brand_id: string; slug: string; name: string };
export type TruckType = {
  id: string;
  slug: string;
  name_en: string;
  name_ku: string;
  name_ar: string;
};
export type PartCategory = TruckType;

export type ListingImage = {
  id: string;
  path: string;
  sort_order: number;
  is_primary: boolean;
};

export type Dealer = {
  id: string;
  owner_id: string;
  slug: string;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  location_id: string | null;
  verified: boolean;
  active: boolean;
  created_at: string;
  location?: LocationRow | null;
};

export type Truck = {
  id: string;
  seller_id: string;
  dealer_id: string | null;
  slug: string;
  brand_id: string;
  model_id: string | null;
  truck_type_id: string | null;
  title: string;
  year: number;
  mileage_km: number | null;
  horsepower: number | null;
  engine: string | null;
  transmission: TransmissionType | null;
  axle_configuration: string | null;
  emission_class: string | null;
  condition: TruckCondition;
  color: string | null;
  price: number;
  currency: CurrencyCode;
  negotiable: boolean;
  description: string | null;
  location_id: string;
  phone: string;
  whatsapp: string | null;
  status: ListingStatus;
  featured: boolean;
  verified_listing: boolean;
  quality_score: number;
  views_count: number;
  rejection_reason: string | null;
  created_at: string;
  published_at: string | null;
  brand?: TruckBrand | null;
  model?: TruckModel | null;
  truck_type?: TruckType | null;
  location?: LocationRow | null;
  images?: ListingImage[];
  dealer?: Pick<Dealer, 'id' | 'slug' | 'business_name' | 'logo_url' | 'verified'> | null;
  seller?: Pick<Profile, 'id' | 'full_name' | 'created_at'> | null;
};

export type Part = {
  id: string;
  seller_id: string;
  dealer_id: string | null;
  slug: string;
  category_id: string;
  title: string;
  brand: string | null;
  part_number: string | null;
  oem_number: string | null;
  condition: PartCondition;
  part_type: PartType | null;
  compatible_brand_id: string | null;
  compatible_models: string[] | null;
  price: number;
  currency: CurrencyCode;
  negotiable: boolean;
  description: string | null;
  location_id: string;
  phone: string;
  whatsapp: string | null;
  status: ListingStatus;
  featured: boolean;
  quality_score: number;
  views_count: number;
  rejection_reason: string | null;
  created_at: string;
  published_at: string | null;
  category?: PartCategory | null;
  compatible_brand?: TruckBrand | null;
  location?: LocationRow | null;
  images?: ListingImage[];
  dealer?: Pick<Dealer, 'id' | 'slug' | 'business_name' | 'logo_url' | 'verified'> | null;
  seller?: Pick<Profile, 'id' | 'full_name' | 'created_at'> | null;
};

export type Paginated<T> = { rows: T[]; total: number; page: number; pageSize: number };
