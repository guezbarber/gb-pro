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
  title: "GBPro",
  applicationName: "GBPro", // Fuerza el nombre en celulares
  description: "Agenda, clientes, marketing y pagos — todo en un solo lugar.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GBPro", // Título específico para iOS
  },
  // Al no poner 'icons' aquí, Next.js agarra automáticamente tu apple-icon.png de la carpeta app
};

export const viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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