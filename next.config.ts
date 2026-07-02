import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // P0: Anti-cache — força o navegador a revalidar arquivos estáticos
  // quando o deploy acontece. Sem isso, o usuário fica com a versão
  // antiga em cache e precisa fazer Ctrl+Shift+R manualmente.
  async headers() {
    return [
      {
        // Arquivos JS/CSS/_next/static — sem cache pra forçar nova versão
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        // Outros assets estáticos (imagens, fontes)
        source: "/:path*.{js,css,ico,png,svg,woff,woff2}",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        // HTML — nunca cachear
        source: "/((?!api).*)",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

export default nextConfig;
