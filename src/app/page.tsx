"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { WorkProducts } from "@/components/landing/WorkProducts";
import { ToolsIntegrations } from "@/components/landing/ToolsIntegrations";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { ProviderSetup } from "@/components/auth/ProviderSetup";
import { useAuth } from "@/lib/lovon/AuthContext";
import { useLovonStore } from "@/lib/lovon/store";
import { Loader2 } from "lucide-react";

type View = "landing" | "auth" | "providers" | "dashboard";

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const { user, loading, refresh } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [view]);

  const handleLaunch = () => {
    if (user) {
      setView("dashboard");
    } else {
      setView("auth");
    }
  };

  // After signup, route user through ProviderSetup first if they don't have any AI integrations yet
  const handleAuthSuccess = () => {
    refresh();
    // Defer state read until next tick to allow store hydration
    setTimeout(() => {
      const integrations = useLovonStore.getState().integrations;
      const hasAIIntegration = integrations.some((i) =>
        ["openai", "anthropic", "groq", "openrouter", "deepseek", "gemini", "nvidia", "minimax"].includes(i.providerKey)
      );
      if (hasAIIntegration) {
        setView("dashboard");
      } else {
        setView("providers");
      }
    }, 100);
  };

  if (loading && view === "dashboard") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-violet-bg">
        <Loader2 className="w-8 h-8 animate-spin text-beige" />
      </div>
    );
  }

  if (view === "auth") {
    return (
      <AuthScreen
        onSuccess={handleAuthSuccess}
        onBack={() => setView("landing")}
      />
    );
  }

  if (view === "providers") {
    return (
      <ProviderSetup
        onComplete={() => setView("dashboard")}
        onSkip={() => setView("dashboard")}
      />
    );
  }

  if (view === "dashboard") {
    if (user) {
      return <Dashboard onExit={() => setView("landing")} />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-violet-bg">
        <Loader2 className="w-8 h-8 animate-spin text-beige" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-violet-bg text-cream overflow-x-hidden">
      <Nav onLaunch={handleLaunch} />
      <Hero onLaunch={handleLaunch} />
      <Features onLaunch={handleLaunch} />
      <WorkProducts />
      <ToolsIntegrations />
      <CTA onLaunch={handleLaunch} />
      <Footer />
    </div>
  );
}
