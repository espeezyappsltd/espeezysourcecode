import { createClient } from './supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export const supabase = createClient()
