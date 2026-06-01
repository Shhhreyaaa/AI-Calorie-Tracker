import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import BottomNavigation from "@/components/layout/BottomNavigation";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Calorie Tracker | Premium Macro Tracking",
  description: "Track your food intake using advanced AI image analysis, daily diaries, and streak rewards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] dark:bg-[#020617] text-[#0F172A] dark:text-[#F8FAFC] font-sans pb-24">
        <main className="flex-1 w-full max-w-md mx-auto px-4 py-6">
          {children}
        </main>
        <BottomNavigation />
      </body>
    </html>
  );
}


