import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar/page";
import Footer from "./components/footer/page";
import { BackendStatusProvider } from "@/lib/BackendStatusContext";
import BackendOfflineBanner from "./components/BackendOfflineBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LocaFinder - Hệ thống hỗ trợ quyết định tìm kiếm mặt bằng thông minh",
  description: "Smart Rental Decision Support System - Ứng dụng BI, Geo-marketing và AI để đánh giá tiềm năng kinh doanh của mặt bằng cho thuê",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="">
        <BackendStatusProvider checkInterval={30000}>
          <header className="">
            <Navbar/>
          </header>
          <BackendOfflineBanner />
          <main>
            {children}
          </main>
          <footer>
            <Footer/>
          </footer>
        </BackendStatusProvider>
      </body>
    </html>
  );
}
