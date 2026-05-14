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
  condition: 'New' | 'Like New' | 'Used' | 'Refurbished'
  created_at: string
  profiles?: {
    full_name: string
    avatar_url: string
    role: string
  }
}

export type MarketplaceCategory = 'All' | 'Electronics' | 'Textbooks' | 'Lab Equipment' | 'Stationery' | 'Hardware' | 'Other';
export type PaymentMethod = 'CASH' | 'STRIPE' | 'BOTH';
export type ListingCondition = 'New' | 'Like New' | 'Used' | 'Refurbished';
