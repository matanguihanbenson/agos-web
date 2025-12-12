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
  metadataBase: new URL("https://agos-web.vercel.app"),
  title: {
    default: "AGOS - Autonomous River Cleaning with AI Technology | Water Pollution Solutions",
    template: "%s | AGOS"
  },
  description: "AGOS uses AI-powered autonomous robots for river cleanup and water quality monitoring. 85% accurate trash detection, real-time analytics, and sustainable solutions for environmental conservation. Transform waterways with innovative technology.",
  keywords: [
    "river cleanup technology",
    "autonomous water cleaning robot",
    "AI trash detection",
    "water quality monitoring",
    "environmental technology",
    "river pollution solution",
    "waste collection robot",
    "sustainable water management",
    "autonomous environmental bot",
    "water conservation technology",
    "smart river cleaning",
    "aquatic waste removal",
    "UN SDG clean water",
    "river monitoring system",
    "pollution prevention technology"
  ],
  authors: [{ name: "Sulong Systems" }],
  creator: "Sulong Systems",
  publisher: "Sulong Systems",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/img/app_launcher.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://agos-web.vercel.app/",
    siteName: "AGOS - Autonomous River Cleaning System",
    title: "AGOS - AI-Powered Autonomous River Cleaning Technology",
    description: "Revolutionary AI-powered autonomous robots for river cleanup and real-time water quality monitoring. Join organizations using AGOS to create cleaner, healthier waterways.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AGOS autonomous robot cleaning river and monitoring water quality",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@AGOS_Systems",
    creator: "@AGOS_Systems",
    title: "AGOS - AI-Powered Autonomous River Cleaning Technology",
    description: "Revolutionary AI-powered autonomous robots for river cleanup and real-time water quality monitoring. 85% accurate trash detection with sustainable solutions.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://agos-web.vercel.app",
  },
  category: "Environmental Technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://agos-web.vercel.app/#organization',
        name: 'Sulong Systems',
        url: 'https://agos-web.vercel.app',
        logo: {
          '@type': 'ImageObject',
          url: 'https://agos-web.vercel.app/img/app_launcher.png',
        },
        description: 'AGOS develops AI-powered autonomous robots for river cleanup and water quality monitoring',
        sameAs: [
          'https://linkedin.com/company/agos-systems',
          'https://twitter.com/AGOS_Systems',
          'https://facebook.com/AGOSSystems',
          'https://instagram.com/agos_systems',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'contact@agos-systems.com',
          contactType: 'Sales',
        },
      },
      {
        '@type': 'Product',
        '@id': 'https://agos-web.vercel.app/#product',
        name: 'AGOS Autonomous River Cleaning System',
        description: 'AI-powered autonomous robots for river cleanup with 85% accurate trash detection, real-time water quality monitoring, and sustainable waste management',
        brand: {
          '@type': 'Brand',
          name: 'AGOS',
        },
        manufacturer: {
          '@id': 'https://agos-web.vercel.app/#organization',
        },
        image: 'https://agos-web.vercel.app/og-image.png',
        category: 'Environmental Technology',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '127',
        },
        offers: {
          '@type': 'Offer',
          availability: 'https://schema.org/InStock',
          url: 'https://agos-web.vercel.app',
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://agos-web.vercel.app/#website',
        url: 'https://agos-web.vercel.app',
        name: 'AGOS - Autonomous River Cleaning System',
        description: 'AI-powered autonomous robots for river cleanup and water quality monitoring',
        publisher: {
          '@id': 'https://agos-web.vercel.app/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://agos-web.vercel.app/?s={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is AGOS?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'AGOS (Autonomous Garbage-cleaning Operation System) uses AI-powered autonomous robots to detect, collect, and monitor river waste in real-time, providing sustainable solutions for water pollution with 85% accurate trash detection.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does AGOS work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'AGOS works in four phases: Deploy bots to target areas, Detect waste using AI vision to identify and classify floating trash, Collect waste and environmental data, and Repurpose waste through recycling and circular economy connections.',
            },
          },
          {
            '@type': 'Question',
            name: 'Who can benefit from AGOS?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'AGOS benefits Local Government Units for cost-effective cleanup, Environmental NGOs for scaled impact, Corporate CSR Programs for measurable sustainability goals, and Research Institutions for comprehensive environmental data collection.',
            },
          },
        ],
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
