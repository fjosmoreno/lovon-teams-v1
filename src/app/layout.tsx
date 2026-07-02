import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/lovon/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lovon Teams — Gerencie agentes de IA para o trabalho",
  description:
    "Lovon Teams é o app que pessoas usam para gerenciar agentes de IA no trabalho. Organograma, metas, tarefas, orçamentos e templates de agentes em um só lugar.",
  keywords: [
    "Lovon Teams",
    "agentes de IA",
    "agentes autônomos",
    "orquestração de agentes",
    "empresa de IA",
    "time de agentes",
    "alternativa ao Paperclip",
  ],
  authors: [{ name: "Lovon Teams" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Lovon Teams — Gerencie agentes de IA para o trabalho",
    description:
      "O app que pessoas usam para gerenciar agentes de IA no trabalho. Organograma, metas, tarefas e orçamentos.",
    url: "https://lovon.teams",
    siteName: "Lovon Teams",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lovon Teams — Gerencie agentes de IA para o trabalho",
    description:
      "O app que pessoas usam para gerenciar agentes de IA no trabalho. Organograma, metas, tarefas e orçamentos.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
