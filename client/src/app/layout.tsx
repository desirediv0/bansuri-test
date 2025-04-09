import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ClientProviders from "@/helper/Providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const brawley = localFont({
  src: "./fonts/Branley.otf",
  variable: "--font-brawley",
  weight: "100 900",
});

const libreFranklin = localFont({
  src: "./fonts/LibreFranklin-VariableFont_wght.ttf",
  variable: "--font-libre-franklin",
  weight: "300 700",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bansurividhyamandir.com'),
  title: 'Bansuri Vidya Mandir | Indian Classical Music Institute',
  description: 'Join Bansuri Vidya Mandir - A premier institute dedicated to teaching Indian classical flute (bansuri), traditional music education, and cultural arts. Experience authentic guru-shishya parampara with expert mentorship.',
  keywords: [
    'bansuri classes',
    'flute learning',
    'indian classical music',
    'music institute',
    'bansuri training',
    'classical flute',
    'music education',
    'cultural arts',
    'indian music school',
    'Bansuri Vidya Mandir'
  ],
  openGraph: {
    title: 'Bansuri Vidya Mandir | Indian Classical Music Institute',
    description: 'Premier institute for Bansuri (Indian Classical Flute) education with traditional guru-shishya teaching methodology.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Bansuri Vidya Mandir Music Institute'
      }
    ],
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#dc2626'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${libreFranklin.variable} ${brawley.variable} antialiased font-libre-franklin`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
