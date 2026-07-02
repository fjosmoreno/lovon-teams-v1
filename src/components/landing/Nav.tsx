"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Menu, X, Github, BookOpen, Star } from "lucide-react";

interface NavProps {
  onLaunch: () => void;
}

export function Nav({ onLaunch }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-violet-bg/80 backdrop-blur-xl border-b border-violet-subtle"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <a href="#top" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-official.png" alt="Lovon Teams" className="h-9 w-auto" />
          </a>

          {/* Desktop nav — minimal like Paperclip */}
          <nav className="hidden md:flex items-center gap-1">
            <a
              href="#blog"
              className="px-3 py-2 text-sm text-violet-muted hover:text-cream transition-colors"
            >
              Blog
            </a>
            <a
              href="#docs"
              className="px-3 py-2 text-sm text-violet-muted hover:text-cream transition-colors"
            >
              Docs
            </a>
            <a
              href="#github"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-violet-muted hover:text-cream transition-colors"
            >
              <Star className="w-3.5 h-3.5" />
              Star
            </a>
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onLaunch}
              className="btn-pill btn-primary-neon text-sm"
            >
              Começar
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-violet-subtle text-cream"
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="md:hidden overflow-hidden border-t border-violet-subtle py-4"
          >
            <nav className="flex flex-col gap-1">
              <a href="#blog" className="px-3 py-2.5 text-sm text-violet-muted hover:text-cream">Blog</a>
              <a href="#docs" className="px-3 py-2.5 text-sm text-violet-muted hover:text-cream">Docs</a>
              <a href="#github" className="px-3 py-2.5 text-sm text-violet-muted hover:text-cream">Star</a>
              <button
                onClick={() => { setMobileOpen(false); onLaunch(); }}
                className="btn-pill btn-primary-neon mt-3 w-full"
              >
                Começar
              </button>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
