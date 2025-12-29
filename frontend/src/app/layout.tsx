import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema TLP - Gestão Tributária",
  description: "Cálculo e Gestão da Taxa de Limpeza Pública",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <div style={{ display: 'flex' }}>
          <Sidebar />
          <main style={{ marginLeft: '280px', width: 'calc(100% - 280px)', minHeight: '100vh', backgroundColor: 'var(--bg-body)' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
