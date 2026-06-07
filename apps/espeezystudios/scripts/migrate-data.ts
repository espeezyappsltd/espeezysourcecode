import { createClient } from '@supabase/supabase-js'

// Usage: npx ts-node scripts/migrate-data.ts

const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL || 'https://njbitvdvylvdhrevqxza.supabase.co'
const OLD_SUPABASE_KEY = process.env.OLD_SUPABASE_KEY

const NEW_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rqazxvcanqiurjlrtkpz.supabase.co'
const NEW_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!OLD_SUPABASE_KEY || !NEW_SUPABASE_KEY) {
  console.error('Missing OLD_SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const oldClient = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY)
const newClient = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY)

const TABLES_TO_MIGRATE = ['platform_apps', 'profiles', 'admin_members']

async function run() {
  console.log('Starting data migration from old to new Supabase project...')
  for (const table of TABLES_TO_MIGRATE) {
    console.log(`\nMigrating table: ${table}`)
    let offset = 0
    const limit = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error } = await oldClient
        .from(table)
        .select('*')
        .range(offset, offset + limit - 1)

      if (error) {
        console.error(`Error fetching ${table}:`, error.message)
        break
      }

      if (!data || data.length === 0) {
        hasMore = false
        break
      }

      console.log(`Fetched ${data.length} records from ${table}. Inserting...`)
      const { error: insertError } = await newClient
        .from(table)
        .upsert(data) // Upsert handles conflicts gracefully

      if (insertError) {
        console.error(`Error inserting into ${table}:`, insertError.message)
      } else {
        console.log(`Inserted batch successfully.`)
      }

      if (data.length < limit) {
        hasMore = false
      } else {
        offset += limit
      }
    }
    console.log(`Finished table: ${table}`)
  }
  console.log('\nMigration complete.')
}

run().catch(console.error)
