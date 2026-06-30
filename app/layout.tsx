import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import GlobalModals from "@/components/GlobalModals";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wisegrams — Short-form Video",
  description:
    "A minimalist, mobile-first vertical video feed. Share moments through Google Drive-powered video streaming.",
  keywords: ["video", "reels", "short-form", "wisegrams"],
  openGraph: {
    title: "Wisegrams",
    description: "Share moments through short-form video",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="bg-black text-foreground antialiased h-full overflow-hidden">
        {/* 
          No artificial width constraint.
          The app fills whatever screen it's on — phone, tablet, desktop.
          Each page is responsible for its own max-width if needed.
        */}
        {children}
        <GlobalModals />
      </body>
    </html>
  );
}
