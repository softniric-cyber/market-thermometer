import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "madridhome.tech",
  description:
    "El termómetro del mercado inmobiliario de Madrid. Indicadores agregados en tiempo real: score de mercado, precios por distrito, tendencias y más.",
  keywords: [
    "inmobiliario",
    "madrid",
    "pisos",
    "precios",
    "mercado",
    "indicadores",
    "madridhome",
  ],
  openGraph: {
    title: "madridhome.tech",
    description: "El termómetro del mercado inmobiliario de Madrid",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
