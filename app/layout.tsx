import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const SITE_URL = "https://comprobantes.peru-hub.com";
const DESCRIPTION = "Descarga tus comprobantes electrónicos (boletas y facturas) por RUC, documento y mes.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "FuelHub · Comprobantes", template: "%s | FuelHub Comprobantes" },
  description: DESCRIPTION,
  applicationName: "FuelHub Comprobantes",
  // Es una herramienta de consulta con datos de terceros: que no aparezca en buscadores.
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: SITE_URL,
    siteName: "FuelHub Comprobantes",
    title: "FuelHub · Comprobantes",
    description: DESCRIPTION,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111008",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es-PE">
      <body>
        <header className="header">
          <svg className="mark" viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="14" fill="#ff6a00" />
            <path d="M32 11C32 11 17 27.5 17 38.5a15 15 0 0 0 30 0C47 27.5 32 11 32 11Z" fill="#17140f" />
            <path d="M25.5 39a6.5 6.5 0 0 0 6.5 6.5" fill="none" stroke="#ff6a00" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
          <div>
            <div className="title">FuelHub · Comprobantes</div>
            <div className="subtitle">Sircon-Nonato</div>
          </div>
        </header>
        {children}
        <footer>FuelHub Cloud — consulta de comprobantes electrónicos.</footer>
      </body>
    </html>
  );
}
