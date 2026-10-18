import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/components/providers/StoreProvider";
import ToastContainer from "@/components/ui/ToastContainer";

const hindSiliguri = Hind_Siliguri({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "শিক্ষণ",
    template: "%s",
  },
  description:
    "শিক্ষার্থী ভর্তি, ডিজিটাল হাজিরা, পরীক্ষার ফলাফল, ব্যাচ রুটিন ও সার্বিক শিক্ষা কার্যক্রম পরিচালনার সমন্বিত শিক্ষণ প্ল্যাটফর্ম।",
  keywords: [
    "শিক্ষণ",
    "shikkhon",
    "coaching management system",
    "কোচিং সফটওয়্যার",
    "শিক্ষার্থী ম্যানেজমেন্ট",
    "বাংলাদেশ শিক্ষা প্রতিষ্ঠান",
    "ডিজিটাল হাজিরা",
  ],
  other: {
    "color-scheme": "light only",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${hindSiliguri.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
        <StoreProvider>
          <ToastContainer />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
