import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// لینک‌های ایمیل (تأیید ثبت‌نام و بازنشانی رمز) و ورود با گوگل با یک code به اینجا برمی‌گردند؛
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

  // خطای گوگل (مثلاً لغو ورود) به‌صورت error در آدرس برمی‌گردد
  const failure = searchParams.has('error') ? 'oauth' : 'link'
  return NextResponse.redirect(`${origin}/login?error=${failure}`)
}
