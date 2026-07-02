"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/lovon/AuthContext";

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

export function AuthScreen({ onSuccess, onBack }: Props) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, name, password);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-violet-bg">
      {/* bg accents — subtle violet */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "#935073" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-[0.05] blur-3xl"
          style={{ background: "#F6DBC0" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-official.png" alt="Lovon Teams" className="h-12 w-auto" />
        </div>

        <div className="p-7 rounded-2xl bg-violet-dark/50 border border-violet-subtle shadow-2xl">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-violet-bg/40 border border-violet-subtle mb-6">
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "login"
                  ? "bg-beige/15 text-beige"
                  : "text-violet-muted hover:text-cream"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setMode("signup"); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "signup"
                  ? "bg-beige/15 text-beige"
                  : "text-violet-muted hover:text-cream"
              }`}
            >
              Criar conta
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="font-serif-display text-lg font-semibold text-cream mb-1">
                {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
              </h2>
              <p className="text-sm text-violet-muted mb-5">
                {mode === "login"
                  ? "Entre para acessar seu time de agentes"
                  : "Comece grátis — sem cartão de crédito"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === "signup" && (
                  <div>
                    <label className="text-xs font-medium text-violet-muted mb-1.5 block">
                      Nome
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-muted" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-violet-bg/50 border border-violet-subtle text-sm text-cream placeholder:text-violet-muted focus:outline-none focus:border-beige/30 focus:bg-violet-bg transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-violet-muted mb-1.5 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@empresa.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-violet-bg/50 border border-violet-subtle text-sm text-cream placeholder:text-violet-muted focus:outline-none focus:border-beige/30 focus:bg-violet-bg transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-violet-muted mb-1.5 block">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-muted" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-violet-bg/50 border border-violet-subtle text-sm text-cream placeholder:text-violet-muted focus:outline-none focus:border-beige/30 focus:bg-violet-bg transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-cream text-violet-bg text-sm font-semibold hover:bg-beige transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                  ) : (
                    <>
                      {mode === "login" ? "Entrar" : "Criar conta"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-xs text-violet-muted hover:text-cream transition-colors"
                >
                  {mode === "login"
                    ? "Não tem conta? Criar agora"
                    : "Já tem conta? Entrar"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Back to site */}
        <div className="mt-5 text-center">
          <button
            onClick={onBack}
            className="text-xs text-violet-muted hover:text-cream transition-colors"
          >
            ← Voltar para o site
          </button>
        </div>

        <div className="mt-4 text-center text-[10px] text-violet-muted">
          Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade.
        </div>
      </motion.div>
    </div>
  );
}
