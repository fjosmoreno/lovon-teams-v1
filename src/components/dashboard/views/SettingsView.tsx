"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Key, CreditCard, Bell, Shield, Terminal, Check, Building2, AlertTriangle, AlertOctagon } from "lucide-react";
import { useLovonStore } from "@/lib/lovon/store";
import { DangerZoneView } from "./DangerZoneView";

const SECTIONS = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "api", label: "API Keys", icon: Key },
  { id: "billing", label: "Faturamento", icon: CreditCard },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "security", label: "Segurança", icon: Shield },
  { id: "local", label: "Local AI", icon: Terminal },
  { id: "company", label: "Empresa", icon: Building2 },
  { id: "danger", label: "Danger Zone", icon: AlertOctagon },
];

export function SettingsView() {
  const [active, setActive] = useState("profile");
  const [monthlyCap, setMonthlyCap] = useState(0);
  const [alerts, setAlerts] = useState({ email: true, slack: false, webhook: false });
  const company = useLovonStore((s) => s.company);
  const agentsCount = useLovonStore((s) => s.agents.length);
  const resetAll = useLovonStore((s) => s.resetAll);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    resetAll();
    setConfirmReset(false);
    // reload to trigger onboarding/seed
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-tech-gray mt-1">Gerencie sua conta, chaves e preferências</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* sidebar */}
        <div className="p-4 rounded-2xl glass border border-white/8 h-fit">
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active === s.id
                    ? s.id === "danger"
                      ? "bg-[#ff8a3d]/10 text-[#ff8a3d] border border-[#ff8a3d]/20"
                      : "bg-neon-green/10 text-neon-green border border-neon-green/20"
                    : "text-tech-gray hover:text-white hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* content */}
        {active === "danger" ? (
          <motion.div
            key="danger"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3"
          >
            <DangerZoneView />
          </motion.div>
        ) : (
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3 p-6 rounded-2xl glass border border-white/8 space-y-6"
        >
          {active === "profile" && (
            <>
              <div>
                <h3 className="text-base font-semibold text-white mb-1">Perfil da empresa</h3>
                <p className="text-xs text-tech-gray mb-5">Informações exibidas para seus agentes e clientes.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Nome da empresa" defaultValue="Lovon Inc." />
                  <Field label="Domínio" defaultValue="lovon.ai" />
                  <Field label="Email de cobrança" defaultValue="finance@lovon.ai" />
                  <Field label="Plano atual" defaultValue="Free Tier" readOnly />
                </div>
                <button className="btn-pill btn-primary-neon text-sm mt-5">Salvar alterações</button>
              </div>
            </>
          )}

          {active === "api" && (
            <>
              <div>
                <h3 className="text-base font-semibold text-white mb-1">Chaves de API</h3>
                <p className="text-xs text-tech-gray mb-5">Chaves para acessar a Lovon via API.</p>
                <div className="space-y-3">
                  {[
                    { name: "Production", key: "lvk_prod_*******************a8f2", created: "Jan 12, 2026" },
                    { name: "Development", key: "lvk_dev_*******************1c4e", created: "Fev 03, 2026" },
                  ].map((k) => (
                    <div key={k.name} className="p-4 rounded-lg bg-black/30 border border-white/8">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">{k.name}</span>
                        <span className="text-[10px] text-tech-gray">Criada em {k.created}</span>
                      </div>
                      <div className="font-mono text-xs text-neon-green">{k.key}</div>
                    </div>
                  ))}
                </div>
                <button className="btn-pill btn-secondary-neon text-sm mt-4">
                  + Gerar nova chave
                </button>
              </div>

              <div className="pt-6 border-t border-white/8">
                <h3 className="text-base font-semibold text-white mb-3">Provedores conectados</h3>
                <div className="space-y-2">
                  {[
                    { name: "OpenAI", key: "sk-...x9f2", status: "Conectado" },
                    { name: "Anthropic", key: "sk-ant-...p4c1", status: "Conectado" },
                    { name: "Google Gemini", key: "AIza...8mQd", status: "Conectado" },
                    { name: "OpenRouter", key: "sk-or-...v2n3", status: "Conectado" },
                    { name: "DeepSeek", key: "—", status: "Desconectado" },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/8">
                      <div>
                        <div className="text-sm font-medium text-white">{p.name}</div>
                        <div className="text-[10px] text-tech-gray font-mono">{p.key}</div>
                      </div>
                      <span className={`text-[10px] font-mono ${p.status === "Conectado" ? "text-neon-green" : "text-tech-gray"}`}>
                        {p.status === "Conectado" && <Check className="w-3 h-3 inline mr-1" />}
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {active === "billing" && (
            <>
              <div>
                <h3 className="text-base font-semibold text-white mb-1">Orçamento mensal</h3>
                <p className="text-xs text-tech-gray mb-5">Defina um teto. A Lovon bloqueia chamadas premium ao atingir.</p>
                <div className="p-5 rounded-xl bg-black/30 border border-white/8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-white">Cap mensal</span>
                    <span className="text-2xl font-bold text-neon-green">R$ {monthlyCap}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={500}
                    step={10}
                    value={monthlyCap}
                    onChange={(e) => setMonthlyCap(Number(e.target.value))}
                    className="w-full accent-[#00F5A0]"
                  />
                  <div className="flex justify-between text-[10px] text-tech-gray mt-2 font-mono">
                    <span>R$ 0</span>
                    <span>R$ 250</span>
                    <span>R$ 500</span>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-neon-green/5 border border-neon-green/20 text-xs text-white">
                    {monthlyCap === 0 ? (
                      <>✓ Apenas modelos gratuitos e locais serão usados. Custo real: <span className="text-neon-green font-semibold">R$ 0/mês</span>.</>
                    ) : (
                      <>Você gastará até <span className="text-neon-green font-semibold">R$ {monthlyCap}/mês</span>. Fallback para free tier ao atingir.</>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {active === "notifications" && (
            <>
              <h3 className="text-base font-semibold text-white mb-1">Notificações</h3>
              <p className="text-xs text-tech-gray mb-5">Receba alertas sobre seus agentes.</p>
              <div className="space-y-3">
                {[
                  { id: "email", label: "Email", desc: "lovon@lovon.ai" },
                  { id: "slack", label: "Slack", desc: "#agents channel" },
                  { id: "webhook", label: "Webhook", desc: "https://lovon.ai/hooks/agents" },
                ].map((n) => (
                  <div key={n.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/8">
                    <div>
                      <div className="text-sm font-medium text-white">{n.label}</div>
                      <div className="text-[10px] text-tech-gray font-mono">{n.desc}</div>
                    </div>
                    <button
                      onClick={() => setAlerts({ ...alerts, [n.id]: !alerts[n.id as keyof typeof alerts] })}
                      className={`relative w-10 h-6 rounded-full transition-all ${
                        alerts[n.id as keyof typeof alerts] ? "bg-neon-green/30" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
                          alerts[n.id as keyof typeof alerts]
                            ? "left-[1.125rem] bg-neon-green"
                            : "left-0.5 bg-white"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {active === "security" && (
            <>
              <h3 className="text-base font-semibold text-white mb-1">Segurança</h3>
              <p className="text-xs text-tech-gray mb-5">Proteja sua conta e dados.</p>
              <div className="space-y-3">
                {[
                  { label: "Autenticação em dois fatores", desc: "Proteja login com TOTP", on: true },
                  { label: "SSO / SAML", desc: "Login único empresarial", on: false },
                  { label: "IP allowlist", desc: "Restringir API a IPs específicos", on: false },
                  { label: "Auditoria de chamadas", desc: "Log completo por 90 dias", on: true },
                  { label: "Criptografia at-rest", desc: "AES-256 para todos os dados", on: true },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/8">
                    <div>
                      <div className="text-sm font-medium text-white">{s.label}</div>
                      <div className="text-[10px] text-tech-gray">{s.desc}</div>
                    </div>
                    <span className={`text-[10px] font-mono ${s.on ? "text-neon-green" : "text-tech-gray"}`}>
                      {s.on ? <><Check className="w-3 h-3 inline mr-1" />Ativo</> : "Inativo"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {active === "local" && (
            <>
              <h3 className="text-base font-semibold text-white mb-1">Local AI</h3>
              <p className="text-xs text-tech-gray mb-5">Configure provedores locais (Ollama, vLLM, LM Studio).</p>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-black/30 border border-[#a855f7]/20">
                  <div className="flex items-center gap-2 mb-2 text-xs font-mono text-tech-gray">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>OLLAMA ENDPOINT</span>
                  </div>
                  <input
                    type="text"
                    defaultValue="http://localhost:11434"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-[#a855f7]/20 text-sm text-neon-purple font-mono focus:outline-none"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-tech-gray">Status: <span className="text-neon-green">Conectado · 8 modelos disponíveis</span></span>
                    <button className="text-xs text-neon-purple hover:underline">Testar conexão</button>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-black/30 border border-white/8">
                  <div className="flex items-center gap-2 mb-2 text-xs font-mono text-tech-gray">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>VLLM ENDPOINT</span>
                  </div>
                  <input
                    type="text"
                    placeholder="http://localhost:8000"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/8 text-sm text-white font-mono placeholder:text-tech-gray focus:outline-none"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-tech-gray">Status: <span className="text-tech-gray">Desconectado</span></span>
                    <button className="text-xs text-neon-purple hover:underline">Conectar</button>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[#a855f7]/5 border border-[#a855f7]/20">
                  <div className="text-sm text-white mb-1">💡 Dica</div>
                  <div className="text-xs text-tech-gray leading-relaxed">
                    Para máxima privacidade, configure todos os seus agentes com tier "Local".
                    Nenhuma chamada sai do seu hardware. Custo: <span className="text-neon-green">R$ 0 para sempre</span>.
                  </div>
                </div>
              </div>
            </>
          )}

          {active === "company" && (
            <>
              <h3 className="text-base font-semibold text-white mb-1">Empresa</h3>
              <p className="text-xs text-tech-gray mb-5">Dados da empresa e zona de perigo.</p>

              {company && (
                <div className="space-y-3 mb-6">
                  <div className="p-4 rounded-lg bg-black/30 border border-white/8">
                    <div className="text-[10px] font-mono text-tech-gray uppercase mb-1">Nome</div>
                    <div className="text-sm text-white">{company.name}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-black/30 border border-white/8">
                    <div className="text-[10px] font-mono text-tech-gray uppercase mb-1">Missão</div>
                    <div className="text-sm text-white">{company.mission}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-lg bg-black/30 border border-white/8">
                      <div className="text-[10px] font-mono text-tech-gray uppercase mb-1">Orçamento</div>
                      <div className="text-sm text-white capitalize">{company.budget}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-black/30 border border-white/8">
                      <div className="text-[10px] font-mono text-tech-gray uppercase mb-1">Agentes</div>
                      <div className="text-sm text-white">{agentsCount}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* safe reset zone */}
              <div className="p-5 rounded-xl bg-[#ff8a3d]/5 border border-[#ff8a3d]/20">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-[#ff8a3d]" />
                  <h4 className="text-sm font-semibold text-[#ff8a3d]">Reset Seguro</h4>
                </div>
                <p className="text-xs text-violet-muted mb-4">
                  Opções seguras para recomeçar sem destruir a auditoria. O audit log é append-only/imutável e sempre preservado.
                </p>

                {/* Archive workspace */}
                <div className="mb-3 p-3 rounded-lg bg-violet-bg/30 border border-violet-subtle">
                  <div className="text-xs font-semibold text-cream mb-1">Arquivar workspace</div>
                  <p className="text-[10px] text-violet-muted mb-2">
                    Cria snapshot completo (agentes, tarefas, config, KB) e arquiva. Audit log preservado. Você pode recomeçar do zero mantendo o histórico.
                  </p>
                  <button
                    onClick={() => {
                      const label = `${company?.name ?? "Workspace"} — ${new Date().toLocaleDateString("pt-BR")}`;
                      useLovonStore.getState().archiveWorkspace(label);
                      useLovonStore.getState().resetOperationalData();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-beige/10 border border-beige/30 text-beige hover:bg-beige/20"
                  >
                    Arquivar e resetar operacional
                  </button>
                </div>

                {/* Reset operational only */}
                <div className="mb-3 p-3 rounded-lg bg-violet-bg/30 border border-violet-subtle">
                  <div className="text-xs font-semibold text-cream mb-1">Reset operacional (mantém KB + Config + Audit)</div>
                  <p className="text-[10px] text-violet-muted mb-2">
                    Remove agentes (exceto CEO), departamentos, tarefas e atividade. Preserva: audit log, Company Core, Knowledge Base, archived workspaces.
                  </p>
                  <button
                    onClick={() => useLovonStore.getState().resetOperationalData()}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#ff8a3d]/10 border border-[#ff8a3d]/30 text-[#ff8a3d] hover:bg-[#ff8a3d]/20"
                  >
                    Resetar dados operacionais
                  </button>
                </div>

                {/* Full wipe (danger) */}
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15">
                  <div className="text-xs font-semibold text-red-400 mb-1">Wipe total (irreversível)</div>
                  <p className="text-[10px] text-violet-muted mb-2">
                    Apaga TUDO incluindo audit log, KB e config. Apenas admin com confirmação dupla.
                  </p>
                  {!confirmReset ? (
                    <button
                      onClick={() => setConfirmReset(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                    >
                      Wipe total
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReset}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600"
                      >
                        Confirmar wipe total
                      </button>
                      <button
                        onClick={() => setConfirmReset(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-violet-muted hover:text-cream"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
        )}
      </div>
    </div>
  );
}

function Field({ label, defaultValue, readOnly }: { label: string; defaultValue: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="text-[10px] font-mono text-tech-gray uppercase mb-1.5 block">{label}</label>
      <input
        type="text"
        defaultValue={defaultValue}
        readOnly={readOnly}
        className={`w-full px-3 py-2 rounded-lg bg-black/40 border border-white/8 text-sm text-white focus:outline-none ${
          readOnly ? "opacity-60 cursor-not-allowed" : "focus:border-neon-green/40"
        }`}
      />
    </div>
  );
}
