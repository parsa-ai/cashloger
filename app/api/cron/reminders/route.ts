import { NextResponse } from 'next/server'
import webpush from 'web-push'

import { DEFAULT_TIMEZONE, REMINDER_WINDOW, isDue, minutesIn, reminderMessage } from '@/lib/reminders'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// pg_cron هر ۵ دقیقه این را صدا می‌زند (supabase/migrations/*_reminders.sql)
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const admin = createAdminClient()
  const now = new Date()

  const { data: settings, error } = await admin
    .from('reminder_settings')
    .select('user_id, times, timezone, last_sent_at')
    .neq('times', '{}')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // در همین پنجره قبلاً فرستاده شده باشد، دوباره نمی‌فرستیم
  const due = (settings ?? []).filter(
    (s) =>
      isDue(s.times as number[], minutesIn(s.timezone || DEFAULT_TIMEZONE, now)) &&
      (!s.last_sent_at || now.getTime() - new Date(s.last_sent_at).getTime() >= REMINDER_WINDOW * 60_000)
  )
  if (due.length === 0) return NextResponse.json({ sent: 0 })

  const userIds = due.map((s) => s.user_id)
  const { data: subscriptions } = await admin
    .from('push_subscriptions')
    .select('endpoint, user_id, p256dh, auth')
    .in('user_id', userIds)

  const expired: string[] = []
  let sent = 0
  await Promise.all(
    (subscriptions ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(reminderMessage()),
          { TTL: REMINDER_WINDOW * 60, urgency: 'normal' }
        )
        sent++
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        // دستگاه اشتراکش را لغو کرده یا برنامه را پاک کرده
        if (status === 404 || status === 410) expired.push(s.endpoint)
        else console.error('push failed', status, err)
      }
    })
  )

  if (expired.length) await admin.from('push_subscriptions').delete().in('endpoint', expired)
  await admin.from('reminder_settings').update({ last_sent_at: now.toISOString() }).in('user_id', userIds)

  return NextResponse.json({ due: due.length, sent, expired: expired.length })
}

export const GET = handle
export const POST = handle
