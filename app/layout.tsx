import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import AppShell from "@/components/web/AppShell";
import DataLoader from "@/components/web/DataLoader";
import { AppHeader } from "@/components/web/AppHeader";
import { TabBar } from "@/components/web/TabBar";
import { Toaster } from "@/components/web/Toaster";
import { createClient } from "@/lib/supabase/server";
import { colorThemeScript } from "@/lib/themes";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "کش لاگر",
  description: "ثبت درآمد و هزینه‌های روزانه",
  appleWebApp: {
    capable: true,
    title: "کش لاگر",
    statusBarStyle: "black-translucent"
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1014" },
  ],
};

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser()

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={vazirmatn.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: colorThemeScript }} />
      </head>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppShell signedIn={!!user}>
            <DataLoader userId={user?.id ?? null} />
            <Toaster />
            {user ? (
              <div className="flex min-h-dvh flex-col">
                <AppHeader />
                <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-[calc(max(env(safe-area-inset-bottom),0.5rem)+9.5rem)]">
                  {children}
                </main>
                <TabBar />
              </div>
            ) : (
              children
            )}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
