import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import AppShell from "@/components/web/AppShell";
import DataLoader from "@/components/web/DataLoader";
import { AppHeader } from "@/components/web/AppHeader";
import { InstallPrompt } from "@/components/web/InstallPrompt";
import { TransactionSheetHost } from "@/components/web/TransactionSheet";
import { SwipeNav } from "@/components/web/SwipeNav";
import { TabBar } from "@/components/web/TabBar";
import { Toaster } from "@/components/web/Toaster";
import { createClient } from "@/lib/supabase/server";
import { installPromptScript } from "@/lib/pwa";
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
    { media: "(prefers-color-scheme: light)", color: "#f2f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#08090b" },
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
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "user"

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={vazirmatn.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: colorThemeScript + installPromptScript }} />
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
            <InstallPrompt />
            {user ? (
              <div className="flex min-h-dvh flex-col">
                <AppHeader userName={userName} />
                <main className="mx-auto w-full max-w-2xl flex-1 overflow-x-clip px-4 pt-[calc(env(safe-area-inset-top)+68px)] pb-[calc(max(env(safe-area-inset-bottom),12px)+96px)]">
                  <SwipeNav>{children}</SwipeNav>
                </main>
                <TabBar />
                <TransactionSheetHost />
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
