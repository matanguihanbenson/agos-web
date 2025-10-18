import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AGOS - Autonomous Garbage-cleaning Operation System",
  description: "Revolutionary bot technology for river cleanup and water quality monitoring",
  openGraph: {
    title: "AGOS - Autonomous Garbage-cleaning Operation System",
    description: "Revolutionary bot technology for river cleanup and water quality monitoring",
    url: "https://p2a-agos-web.vercel.app/", 
    siteName: "AGOS",
    images: [
      {
        url: "https://p2a-agos-web.vercel.app/og-image.png", 
        width: 1200,
        height: 630,
        alt: "AGOS bot cleaning river",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AGOS - Autonomous Garbage-cleaning Operation System",
    description: "Revolutionary bot technology for river cleanup and water quality monitoring",
    images: ["https://p2a-agos-web.vercel.app/og-image.png"], // Same image as above
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
