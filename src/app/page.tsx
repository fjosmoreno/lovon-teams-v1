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
import { useAuth } from "@/lib/lovon/AuthContext";
import { Loader2 } from "lucide-react";

type View = "landing" | "auth" | "dashboard";

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
        onSuccess={() => {
          refresh();
          setView("dashboard");
        }}
        onBack={() => setView("landing")}
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
