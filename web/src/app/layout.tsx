import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"] });

export const metadata: Metadata = {
  title: "Request a Quote — Mohammad Adeeb",
  description:
    "Websites, apps, custom software and AI automations. Tell me about your project and get a personalized reply in seconds.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" dir="ltr" className={`dark ${inter.variable} ${cairo.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
