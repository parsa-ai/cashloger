// با هر تغییر مسیر دوباره ساخته می‌شود و صفحه با انیمیشن وارد می‌شود
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>
}
