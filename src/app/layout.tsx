import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const canvaSans = localFont({
  src: [
    { path: "../../public/fonts/canva-sans/CanvaSans-Regular.otf",       weight: "400", style: "normal" },
    { path: "../../public/fonts/canva-sans/CanvaSans-RegularItalic.otf", weight: "400", style: "italic" },
    { path: "../../public/fonts/canva-sans/CanvaSans-Medium.otf",        weight: "500", style: "normal" },
    { path: "../../public/fonts/canva-sans/CanvaSans-MediumItalic.otf",  weight: "500", style: "italic" },
    { path: "../../public/fonts/canva-sans/CanvaSans-Bold.otf",          weight: "700", style: "normal" },
    { path: "../../public/fonts/canva-sans/CanvaSans-BoldItalic.otf",    weight: "700", style: "italic" },
  ],
  variable: "--font-canva-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cmtdetailing.com"),
  title: "Mobile Car Detailing in Taunton, MA | CMT Detailing",
  description:
    "Mobile detailing in Taunton, MA & nearby towns. Interior, full details, paint correction & ceramic coating at your driveway. See prices & request a booking.",
  openGraph: {
    type: "website",
    siteName: "CMT Detailing",
    title: "Mobile Car Detailing in Taunton, MA | CMT Detailing",
    description:
      "Mobile detailing in Taunton, MA & nearby towns. Interior, full details, paint correction & ceramic coating at your driveway. See prices & request a booking.",
    url: "https://cmtdetailing.com",
    images: [
      {
        url: "/images/hero-mustang.jpg",
        alt: "CMT Detailing — professionally detailed Mustang",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mobile Car Detailing in Taunton, MA | CMT Detailing",
    description:
      "Mobile detailing in Taunton, MA & nearby towns. Interior, full details, paint correction & ceramic coating at your driveway.",
    images: ["/images/hero-mustang.jpg"],
  },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "CMT Detailing",
  description:
    "Professional mobile car detailing in Taunton, MA — interior, exterior and full details, paint enhancement and correction, and ceramic coating, brought directly to your driveway.",
  url: "https://cmtdetailing.com",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Taunton",
    addressRegion: "MA",
    addressCountry: "US",
  },
  areaServed: [
    "Taunton, MA",
    "Raynham, MA",
    "Bridgewater, MA",
    "Middleborough, MA",
    "Lakeville, MA",
    "Norton, MA",
    "Attleboro, MA",
    "Easton, MA",
    "Mansfield, MA",
    "Fall River, MA",
    "Dighton, MA",
    "Berkley, MA",
    "Rehoboth, MA",
    "Freetown, MA",
    "Somerset, MA",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${canvaSans.variable} ${montserrat.variable} font-sans`}>
        <Navbar />
        <main>{children}</main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd),
          }}
        />
      </body>
    </html>
  );
}
