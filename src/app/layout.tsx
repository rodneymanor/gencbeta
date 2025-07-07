import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import { ClipboardDetectionProvider } from "@/components/clipboard-detection-provider";
import { AppStateProvider } from "@/contexts/app-state-context";
import { AuthProvider } from "@/contexts/auth-context";
import { UsageProvider } from "@/contexts/usage-context";
import { VideoPlaybackProvider } from "@/contexts/video-playback-context";
import { ReactQueryProvider } from "@/providers/react-query-provider";

import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Gen C Beta",
  description: "Script writing application",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`${poppins.className} min-h-screen antialiased`}>
        <ReactQueryProvider>
          <AuthProvider>
            <UsageProvider>
              <AppStateProvider>
                <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange enableSystem={false}>
                  <VideoPlaybackProvider>
                    <ClipboardDetectionProvider>{children}</ClipboardDetectionProvider>
                  </VideoPlaybackProvider>
                  <Toaster />
                </ThemeProvider>
              </AppStateProvider>
            </UsageProvider>
          </AuthProvider>
        </ReactQueryProvider>
        <SpeedInsights />
        <Script src="//assets.mediadelivery.net/playerjs/player-0.1.0.min.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
