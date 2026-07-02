"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";

// === P0: Version Watcher — detecta quando há nova versão deployada ===
// O servidor expõe /api/version (build time stamp). Se mudar entre checks,
// significa que houve deploy → mostra banner "Nova versão disponível".

interface VersionInfo {
  buildId: string;
  deployedAt: string;
}

let cachedVersion: string | null = null;
let pollInterval: ReturnType<typeof setInterval> | null = null;

export function VersionBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [newVersion, setNewVersion] = useState<VersionInfo | null>(null);

  useEffect(() => {
    // Initial fetch
    checkVersion();
    // Poll every 60s
    pollInterval = setInterval(checkVersion, 60_000);
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  async function checkVersion() {
    try {
      const res = await fetch("/api/version", { cache: "no-store" });
      if (!res.ok) return;
      const data: VersionInfo = await res.json();
      // First time → just cache, no banner
      if (cachedVersion === null) {
        cachedVersion = data.buildId;
        return;
      }
      // Version changed → new deploy detected
      if (data.buildId !== cachedVersion) {
        setNewVersion(data);
        setShowBanner(true);
      }
    } catch {
      // silent fail — version check is best-effort
    }
  }

  function handleReload() {
    // Update cache before reload to avoid showing banner again
    if (newVersion) cachedVersion = newVersion.buildId;
    window.location.reload();
  }

  function handleDismiss() {
    setShowBanner(false);
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-3 p-3 bg-neon-green/15 border-b border-neon-green/40 backdrop-blur-sm"
        >
          <RefreshCw className="w-4 h-4 text-neon-green animate-pulse" />
          <span className="text-sm text-cream">
            <span className="font-semibold text-neon-green">Nova versão disponível!</span>
            {" "}Atualize pra ver as últimas mudanças.
          </span>
          <button
            onClick={handleReload}
            className="px-3 py-1 rounded-lg bg-neon-green/20 border border-neon-green/40 text-neon-green text-xs font-medium hover:bg-neon-green/30 transition-colors"
          >
            Atualizar agora
          </button>
          <button
            onClick={handleDismiss}
            className="ml-1 p-1 rounded text-violet-muted hover:text-cream transition-colors"
            title="Dispensar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
