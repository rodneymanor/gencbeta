import { ReactNode } from "react";

import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import { ThemeProvider } from "next-themes";

import { ClipboardDetectionProvider } from "@/components/clipboard-detection-provider";
import { QueryProvider } from "@/components/providers/query-client-provider";
import { Toaster } from "@/components/ui/sonner";
import { APP_CONFIG } from "@/config/app-config";
import { AppStateProvider } from "@/contexts/app-state-context";
import { AuthProvider } from "@/contexts/auth-context";
import { UsageProvider } from "@/contexts/usage-context";

import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`${poppins.className} min-h-screen antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <UsageProvider>
              <AppStateProvider>
                <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange enableSystem={false}>
                  <ClipboardDetectionProvider>{children}</ClipboardDetectionProvider>
                  <Toaster />
                </ThemeProvider>
              </AppStateProvider>
            </UsageProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
