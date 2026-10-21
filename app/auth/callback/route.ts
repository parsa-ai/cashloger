import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// لینک‌های ایمیل (تأیید ثبت‌نام و بازنشانی رمز) با یک code به اینجا برمی‌گردند؛
// code با نشست کاربر عوض می‌شود و کاربر به مقصد اصلی می‌رود
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  // فقط مسیرهای داخلی، تا لینک به سایت دیگری هدایت نشود
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`)
  }

  return NextResponse.redirect(`${origin}/login?error=link`)
}
