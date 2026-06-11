import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar"; 
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "GB PRO | El sistema operativo para barberías",
  description: "Marketplace global y gestión para barberías de alto nivel.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        {children} 
        <Footer />
      </body>
    </html>
  );
}