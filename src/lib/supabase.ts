import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Offline sync helpers
const STORAGE_PREFIX = 'sidequest-sync:'

export async function syncFromServer(table: string, userId: string) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  
  if (error) throw error
  
  // Cache locally for offline use
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_PREFIX}${table}`, JSON.stringify(data))
  }
  
  return data
}

export function getLocalData<T>(table: string): T[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(`${STORAGE_PREFIX}${table}`)
  return stored ? JSON.parse(stored) : []
}
