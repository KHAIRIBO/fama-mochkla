import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FixMyCity — Community Problem Reporting",
  description:
    "Help fix your city one report at a time. Report potholes, broken streetlights, garbage, and more — all on an interactive live map.",
  keywords: ["community", "city", "reporting", "problems", "potholes", "infrastructure"],
  openGraph: {
    title: "FixMyCity",
    description: "Report It. Help Fix Your City — One Report at a Time.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-white">
        {children}
      </body>
    </html>
  );
}
