import "./globals.css";

/**
 * Minimal root layout — the real layout with metadata and JSON-LD
 * lives in app/[locale]/layout.tsx where we have access to the locale.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
