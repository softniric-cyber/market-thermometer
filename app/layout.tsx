import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Termómetro Inmobiliario Madrid",
  description:
    "Indicadores agregados del mercado inmobiliario de Madrid en tiempo real. Score de mercado, precios por distrito, tendencias y más.",
  keywords: [
    "inmobiliario",
    "madrid",
    "pisos",
    "precios",
    "mercado",
    "indicadores",
  ],
  openGraph: {
    title: "Termómetro Inmobiliario Madrid",
    description: "El pulso del mercado inmobiliario madrileño",
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
