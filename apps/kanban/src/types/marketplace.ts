export interface Listing {
  id: string
  title: string
  description: string
  price: number
  is_free: boolean
  images: string[]
  meetup_zone: string
  meetup_details: string
  duration_days: number
  payment_method: string
  status: string
  owner_id: string
  category: string
  quantity: number
  listing_type?: 'physical' | 'digital'
  delivery_kind?: 'meetup' | 'file' | 'link'
  digital_url?: string | null
  digital_content?: string | null
  quantity_available?: number | null
  purchase_count?: number
  view_count?: number
  engagement_score?: number
  is_platform_seed?: boolean
  condition: 'New' | 'Like New' | 'Used' | 'Refurbished'
  created_at: string
  profiles?: {
    id?: string
    full_name: string
    avatar_url: string
    role: string
    username?: string | null
  }
}

export type MarketplaceCategory =
  | 'All'
  | 'Electronics'
  | 'Textbooks'
  | 'Lab Equipment'
  | 'Stationery'
  | 'Hardware'
  | 'Tutorials'
  | 'Other'
export type PaymentMethod = 'CASH' | 'STRIPE' | 'BOTH';
export type ListingCondition = 'New' | 'Like New' | 'Used' | 'Refurbished';
