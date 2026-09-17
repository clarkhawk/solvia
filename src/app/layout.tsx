import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://solviaa.vercel.app"),
  title: "Solviaa",
  description: "Solviaa, Anticipez l'impayé, assurez l'avenir. Plateforme intelligente de gestion et de prévention des impayés.",
  openGraph: {
    title: "Solviaa — Anticipez l'impayé, assurez l'avenir",
    description: "La plateforme intelligente de gestion et de prévention des impayés.",
    url: "https://solviaa.vercel.app",
    siteName: "Solviaa",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Solviaa — Plateforme de gestion et de prévention des impayés",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solviaa — Anticipez l'impayé, assurez l'avenir",
    description: "La plateforme intelligente de gestion et de prévention des impayés.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
