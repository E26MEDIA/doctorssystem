import type { Metadata } from "next";
import { Outfit, Manrope } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getClinicConfig } from "@/lib/settings";
import "./globals.css";

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const clinic = await getClinicConfig();
  return {
    title: {
      default: `${clinic.name} — ${clinic.doctor}`,
      template: `%s · ${clinic.name}`,
    },
    description: clinic.tagline,
    openGraph: {
      title: `${clinic.name} — ${clinic.doctor}`,
      description: clinic.tagline,
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clinic = await getClinicConfig();

  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <Header brand={{ name: clinic.name, doctor: clinic.doctor }} />
        <main className="flex-1">{children}</main>
        <Footer clinic={clinic} />
      </body>
    </html>
  );
}
