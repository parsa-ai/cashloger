import 'server-only'
import { createClient } from '@supabase/supabase-js'

// کلاینت با کلید service role؛ فقط سمت سرور (import 'server-only' جلوی استفاده در مرورگر را می‌گیرد)
export function createAdminClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
