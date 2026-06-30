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
      {/* 
        The body is a centered flex container with a dark background.
        The actual app is constrained to a mobile width (max-w-[430px]) 
        so it looks perfect on both desktop and mobile devices.
      */}
      <body className="bg-neutral-950 text-foreground antialiased h-full overflow-hidden flex justify-center">
        <div className="w-full h-full max-w-[430px] bg-black relative border-x border-neutral-900 shadow-2xl overflow-hidden flex flex-col">
          {children}
          {/* Global modals are rendered inside the mobile container */}
          <GlobalModals />
        </div>
      </body>
    </html>
  );
}
