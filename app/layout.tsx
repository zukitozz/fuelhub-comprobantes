import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "FuelHub · Comprobantes",
  description: "Busca y descarga tu comprobante electrónico por RUC, serie y correlativo.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="header">
          <div className="mark" aria-hidden="true" />
          <div>
            <div className="title">FuelHub · Comprobantes</div>
            <div className="subtitle">Sircon-Nonato</div>
          </div>
        </div>
        {children}
        <footer>FuelHub Cloud — consulta de comprobantes electrónicos.</footer>
      </body>
    </html>
  );
}
