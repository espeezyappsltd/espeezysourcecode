import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function seed() {
  const supabase = createAdminSupabaseClient()
  
  // 1. Get a test user
  const { data: profiles } = await supabase.from('profiles').select('id').limit(5)
  if (!profiles || profiles.length === 0) {
    console.log('No users found to seed data for.')
    return
  }
  
  const userId = profiles[0].id
  console.log(`Seeding data for user: ${userId}...`)

  // 2. Seed Personal Assets
  const assets = [
    { user_id: userId, title: 'Literature Review Template', asset_type: 'document', asset_url: 'https://example.com/lit-review.docx', category: 'writing', size_bytes: 1024 * 50 },
    { user_id: userId, title: 'Python Data Scraper', asset_type: 'code', asset_url: 'https://example.com/scraper.py', category: 'coding', size_bytes: 1024 * 12 },
    { user_id: userId, title: 'Project Management Icons', asset_type: 'image', asset_url: 'https://example.com/icons.zip', category: 'design', size_bytes: 1024 * 1024 * 2 },
  ]
  await supabase.from('personal_assets').upsert(assets)
  console.log('Seeded Personal Assets.')

  // 3. Seed Marketplace Listings
  const listings = [
    { user_id: userId, title: 'Premium Thesis Deck', description: 'A high-converting presentation template for final year projects.', category: 'design', asset_url: 'https://example.com/thesis.pptx', price: 25 },
    { user_id: userId, title: 'Statistical Analysis Guide', description: 'Complete walkthrough for SPSS and R.', category: 'research', asset_url: 'https://example.com/stats.pdf', price: 15 },
  ]
  await supabase.from('marketplace_assets').upsert(listings)
  console.log('Seeded Marketplace Listings.')

  // 4. Seed Hustle Tasks
  const tasks = [
    { poster_id: userId, title: 'Proofread my Dissertation', description: 'Need someone to check 5,000 words for grammar and flow.', category: 'writing', payout_cents: 5000, status: 'open' },
    { poster_id: userId, title: 'Create Logo for Startup', description: 'Minimalist logo for a student-led AI project.', category: 'design', payout_cents: 3000, status: 'open' },
    { poster_id: userId, title: 'Clean CSV Dataset', description: 'Clean up 500 rows of survey data for analysis.', category: 'coding', payout_cents: 2000, status: 'open' },
  ]
  await supabase.from('hustle_tasks').upsert(tasks)
  console.log('Seeded Hustle Tasks.')

  console.log('Seeding complete!')
}

seed().catch(console.error)
