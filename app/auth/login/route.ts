import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const INVALID = 'نام کاربری/ایمیل یا رمز عبور اشتباه است'

// ورود با نام کاربری یا ایمیل. نام کاربری اینجا (سمت سرور) به ایمیل تبدیل می‌شود
// تا ایمیل کاربران هیچ‌وقت از طریق API قابل خواندن نباشد.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const identifier = typeof body?.identifier === 'string' ? body.identifier.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!identifier || !password) {
    return NextResponse.json({ error: INVALID }, { status: 400 })
  }

  let email = identifier
  if (!identifier.includes('@')) {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('username', identifier.toLowerCase())
      .maybeSingle()
    if (!profile) return NextResponse.json({ error: INVALID }, { status: 401 })

    const { data, error } = await admin.auth.admin.getUserById(profile.id)
    if (error || !data.user?.email) return NextResponse.json({ error: INVALID }, { status: 401 })
    email = data.user.email
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return NextResponse.json({ error: 'ایمیل هنوز تأیید نشده', code: 'email_not_confirmed' }, { status: 401 })
    }
    if (error.message.includes('Invalid login credentials')) {
      return NextResponse.json({ error: INVALID }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: error.status ?? 400 })
  }
  return NextResponse.json({ ok: true })
}
