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
  title: "CMT Detailing",
  description: "Professional mobile car detailing — we come to you.",
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
      </body>
    </html>
  );
}
