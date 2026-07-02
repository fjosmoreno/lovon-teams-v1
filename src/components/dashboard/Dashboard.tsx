"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Crown,
  Building2,
  ListTodo,
  Radio,
  Bot,
  PlusCircle,
  Store,
  Route,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  Bell,
  Search,
  ChevronRight,
  Activity,
  History,
  BookOpen,
  Mail,
  Globe,
  Wrench,
  Megaphone,
  Plug,
  Cpu,
  Calendar,
} from "lucide-react";
import { useLovonStore } from "@/lib/lovon/store";
import { useAuth } from "@/lib/lovon/AuthContext";
import { ensureCompanyExists } from "@/lib/lovon/engine";
import { Onboarding } from "./Onboarding";
import { CommandCenter } from "./views/CommandCenter";
import { DashboardOverview } from "./views/Overview";
import { CEOConsole } from "./views/CEOConsole";
import { Company } from "./views/Company";
import { Tasks } from "./views/Tasks";
import { ActivityFeed } from "./views/ActivityFeed";
import { AgentsList } from "./views/AgentsList";
import { CreateAgent } from "./views/CreateAgent";
import { MarketView } from "./views/MarketView";
import { RoutingView } from "./views/RoutingView";
import { AnalyticsView } from "./views/AnalyticsView";
import { SettingsView } from "./views/SettingsView";
import { OrgChartView } from "./views/OrgChartView";
import { AuditLog } from "./views/AuditLog";
import { CompanySettings } from "./views/CompanySettings";
import { KnowledgeBase } from "./views/KnowledgeBase";
import { EmailAgent } from "./views/EmailAgent";
import { WebResearch } from "./views/WebResearch";
import { SkillsView } from "./views/SkillsView";
import { WorkProductsView } from "./views/WorkProductsView";
import { IntegrationsView } from "./views/IntegrationsView";
import { SmartRoutingView } from "./views/SmartRoutingView";
import { CEOAutonomyView } from "./views/CEOAutonomyView";
import { MeetingView } from "./views/MeetingView";

type View =
  | "command"
  | "overview"
  | "ceo"
  | "company"
  | "orgchart"
  | "audit"
  | "company-config"
  | "knowledge-base"
  | "email"
  | "research"
  | "skills"
  | "work-products"
  | "integrations"
  | "smart-routing"
  | "ceo-autonomy"
  | "meeting"
  | "tasks"
  | "activity"
  | "agents"
  | "create"
  | "market"
  | "routing"
  | "analytics"
  | "settings";

interface Props {
  onExit: () => void;
}

const NAV_GROUPS: { label: string; items: { id: View; label: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
  {
    label: "Operação",
    items: [
      { id: "command", label: "Centro de Comando", icon: Activity },
      { id: "ceo", label: "Console do CEO", icon: Crown },
      { id: "meeting", label: "Modo Reunião", icon: Calendar },
      { id: "orgchart", label: "Organograma", icon: Building2 },
      { id: "company", label: "Empresa", icon: Building2 },
      { id: "tasks", label: "Tarefas", icon: ListTodo },
      { id: "activity", label: "Atividade", icon: Radio },
    ],
  },
  {
    label: "Agentes",
    items: [
      { id: "agents", label: "Agentes", icon: Bot },
      { id: "create", label: "Criar Agente", icon: PlusCircle },
      { id: "market", label: "Marketplace", icon: Store },
      { id: "routing", label: "Roteamento Inteligente", icon: Route },
      { id: "email", label: "Email Agent", icon: Mail },
      { id: "research", label: "Web Research", icon: Globe },
    ],
  },
  {
    label: "Configuração",
    items: [
      { id: "company-config", label: "Company Core", icon: Sparkles },
      { id: "knowledge-base", label: "Knowledge Base", icon: BookOpen },
      { id: "skills", label: "Skills & Tools", icon: Wrench },
      { id: "work-products", label: "Work Products", icon: Megaphone },
      { id: "integrations", label: "Integrações", icon: Plug },
      { id: "smart-routing", label: "Smart Routing", icon: Cpu },
      { id: "ceo-autonomy", label: "CEO Autonomy", icon: Crown },
    ],
  },
  {
    label: "Sistema",
    items: [
      { id: "analytics", label: "Análises", icon: BarChart3 },
      { id: "audit", label: "Histórico", icon: History },
      { id: "settings", label: "Configurações", icon: Settings },
    ],
  },
];

export function Dashboard({ onExit }: Props) {
  const [view, setView] = useState<View>("command");
  const [integrationFilterCapability, setIntegrationFilterCapability] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const company = useLovonStore((s) => s.company);
  const agentsCount = useLovonStore((s) => s.agents.length);
  const tasksActive = useLovonStore((s) => s.tasks.filter((t) => t.status === "in_progress" || t.status === "delegated").length);
  const tasksPendingUnassigned = useLovonStore((s) => s.tasks.filter((t) => t.status === "pending" && !t.assignedTo).length);
  const hydrated = useLovonStore((s) => s.hydrated);
  const { user, logout } = useAuth();

  // Auto-seed a default company + Company Core DNA on every dashboard load
  // (idempotent — won't overwrite existing config)
  useEffect(() => {
    if (hydrated) {
      ensureCompanyExists();
    }
  }, [hydrated]);

  const pendingCount = tasksPendingUnassigned;

  const renderView = () => {
    switch (view) {
      case "command":
        return <CommandCenter onNavigate={setView} />;
      case "overview":
        return <DashboardOverview onNavigate={setView} />;
      case "ceo":
        return <CEOConsole />;
      case "orgchart":
        return <OrgChartView onNavigate={setView} />;
      case "company":
        return <Company />;
      case "tasks":
        return <Tasks onNavigateToIntegrations={(capability) => {
          setIntegrationFilterCapability(capability);
          setView("integrations");
        }} />;
      case "activity":
        return <ActivityFeed />;
      case "agents":
        return <AgentsList onCreate={() => setView("create")} />;
      case "create":
        return <CreateAgent onDone={() => setView("agents")} />;
      case "market":
        return <MarketView />;
      case "routing":
        return <RoutingView />;
      case "email":
        return <EmailAgent />;
      case "research":
        return <WebResearch />;
      case "analytics":
        return <AnalyticsView />;
      case "audit":
        return <AuditLog />;
      case "company-config":
        return <CompanySettings />;
      case "knowledge-base":
        return <KnowledgeBase />;
      case "skills":
        return <SkillsView />;
      case "work-products":
        return <WorkProductsView />;
      case "integrations":
        return <IntegrationsView initialFilterCapability={integrationFilterCapability as any} />;
      case "smart-routing":
        return <SmartRoutingView />;
      case "ceo-autonomy":
        return <CEOAutonomyView />;
      case "settings":
        return <SettingsView />;
      case "meeting":
        return <MeetingView />;
    }
  };

  return (
    <div className="min-h-screen flex bg-deep-black text-white">
      {/* sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 z-40 transform transition-transform duration-300 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          background: "rgba(10, 10, 15, 0.95)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="h-full flex flex-col p-4 overflow-y-auto no-scrollbar">
          {/* logo */}
          <div className="flex items-center justify-between mb-6 px-2">
            <button onClick={onExit} className="flex items-center gap-2.5 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-official.png" alt="Lovon Teams" className="h-10 w-auto" />
            </button>
          </div>

          {/* company badge */}
          {company && (
            <div className="mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/8">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-3.5 h-3.5 text-neon-green" />
                <span className="text-xs font-semibold text-white truncate">
                  {company.name}
                </span>
              </div>
              <div className="text-[10px] text-tech-gray">
                {agentsCount} agentes · {tasksActive} ativas
              </div>
            </div>
          )}

          {/* nav groups */}
          <nav className="flex-1 space-y-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="px-2 mb-2 text-[9px] font-mono uppercase tracking-wider text-tech-gray/60">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = view === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setView(item.id);
                          setMobileNavOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          isActive
                            ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
                            : "text-tech-gray hover:text-white hover:bg-white/[0.03] border border-transparent"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                        {item.id === "command" && pendingCount > 0 && (
                          <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff8a3d]/20 text-[#ff8a3d]">
                            {pendingCount}
                          </span>
                        )}
                        {item.id === "tasks" && tasksActive > 0 && (
                          <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#b6ff3d]/20 text-[#b6ff3d]">
                            {tasksActive}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* credits widget */}
          <div className="p-3 rounded-xl border border-white/8 bg-white/[0.02] mb-3 mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-tech-gray">Créditos este mês</span>
              <span className="text-xs font-mono text-neon-green">R$ 0,00</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-cream rounded-full"
                style={{ width: "0%" }}
              />
            </div>
            <div className="mt-2 text-[10px] text-tech-gray">
              Plano Free · 100% via modelos gratuitos
            </div>
          </div>

          {/* exit */}
          <button
            onClick={onExit}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-tech-gray hover:text-white hover:bg-white/[0.03] transition-all"
          >
            <LogOut className="w-4 h-4" />
            Voltar ao site
          </button>
        </div>
      </aside>

      {/* backdrop for mobile */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
        />
      )}

      {/* main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* topbar */}
        <header
          className="sticky top-0 z-20 px-5 sm:px-8 h-16 flex items-center justify-between border-b border-white/5"
          style={{
            background: "rgba(10,10,15,0.8)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center"
              aria-label="open nav"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-tech-gray">
              <span>Painel</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">
                {NAV_GROUPS.flatMap((g) => g.items).find((n) => n.id === view)?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/8 text-xs text-tech-gray">
              <Search className="w-3.5 h-3.5" />
              <span>Buscar agentes...</span>
              <kbd className="ml-2 px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono">
                ⌘K
              </kbd>
            </div>
            <button
              onClick={() => setView("command")}
              className={`relative w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                view === "command"
                  ? "border-neon-green/30 bg-neon-green/10 text-neon-green"
                  : "border-white/8 text-tech-gray hover:text-white"
              }`}
              aria-label="notificações"
            >
              <Bell className="w-4 h-4" />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-[#ff8a3d] text-deep-black text-[8px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-9 h-9 rounded-lg bg-cream flex items-center justify-center text-violet-bg font-bold text-sm hover:opacity-90 transition-opacity"
                aria-label="menu do usuário"
              >
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </button>
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-11 w-56 p-3 rounded-xl bg-[#14161C] border border-white/[0.08] shadow-2xl z-50"
                  >
                    <div className="px-2 py-1.5 mb-2 border-b border-white/[0.06]">
                      <div className="text-sm font-medium text-[#E5E7EB] truncate">{user?.name ?? "Usuário"}</div>
                      <div className="text-[10px] text-[#9CA3AF] truncate">{user?.email}</div>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); onExit(); }}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-white/[0.03] transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Voltar ao site
                    </button>
                    <button
                      onClick={async () => { setUserMenuOpen(false); await logout(); onExit(); }}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-[#9CA3AF] hover:text-red-400 hover:bg-red-500/5 transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sair da conta
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* content */}
        <main className="flex-1 p-5 sm:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
