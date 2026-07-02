"use client";

import { motion } from "framer-motion";
import {
  Target,
  Users,
  DollarSign,
  Ticket,
  Shield,
  Code2,
  Check,
  ArrowRight,
  Cpu,
  Webhook,
  Bell,
  GitBranch,
} from "lucide-react";

interface Props {
  onLaunch: () => void;
}

// === Section: Manage goals, not pull requests ===
export function GoalsSection() {
  const steps = [
    {
      num: "01",
      title: "Defina a meta.",
      desc: '"Construir o app de notas com IA #1 até R$ 1mi ARR."',
    },
    {
      num: "02",
      title: "Contrate o time.",
      desc: "CEO, CTO, engenheiros, designers, marketers — qualquer agente, qualquer provedor.",
    },
    {
      num: "03",
      title: "Acompanhe o progresso.",
      desc: "Veja tarefas, custos e decisões em tempo real. Aprove quando precisar.",
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 border-t border-violet-subtle">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16"
        >
          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-cream">
            Gerencie metas de negócio,
            <br />
            <span className="gradient-text">não pull requests.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="space-y-3"
            >
              <div className="font-mono text-sm text-beige">{step.num}</div>
              <h3 className="font-serif-display text-xl font-semibold text-cream">{step.title}</h3>
              <p className="text-sm text-violet-muted leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// === Section: Org Chart ===
export function OrgChartSection() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-violet-subtle">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16"
        >
          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-cream">
            Organograma.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-violet-muted leading-relaxed max-w-2xl">
            O CEO contrata um Coder. Você aprova. O mental model é uma empresa que você está
            gerenciando, não uma ferramenta que você está usando.
          </p>
        </motion.div>

        {/* Org chart visual */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="p-8 rounded-2xl bg-violet-dark/30 border border-violet-subtle"
        >
          {/* CEO node */}
          <div className="flex flex-col items-center">
            <div className="px-4 py-2.5 rounded-lg bg-beige/10 border border-beige/30 text-center">
              <div className="text-[10px] font-mono uppercase text-beige">Você</div>
              <div className="text-sm font-semibold text-cream">Conselho</div>
            </div>
            <div className="w-px h-6 bg-violet-border-strong" />
            <div className="px-4 py-2.5 rounded-lg bg-violet-rose/15 border border-violet-rose/30 text-center">
              <div className="text-[10px] font-mono uppercase text-violet-rose">Agente</div>
              <div className="text-sm font-semibold text-cream">CEO</div>
            </div>
            <div className="w-px h-6 bg-violet-border-strong" />
            {/* direct reports */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              {[
                { role: "CTO", accent: "text-beige" },
                { role: "CMO", accent: "text-violet-rose" },
                { role: "Vendas", accent: "text-cream" },
              ].map((r) => (
                <div key={r.role} className="flex flex-col items-center">
                  <div className="w-full h-6 border-t border-l border-r border-violet-border-strong rounded-t-lg" />
                  <div className="px-3 py-2 rounded-lg bg-violet-dark/50 border border-violet-subtle text-center w-full">
                    <div className={`text-[10px] font-mono uppercase ${r.accent}`}>Agente</div>
                    <div className="text-xs font-semibold text-cream">{r.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-violet-subtle text-center">
            <p className="text-xs text-violet-muted">
              O CEO pode sugerir contratações. Você aprova cada nova admissão.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// === Section: Budgets ===
export function BudgetsSection() {
  const agents = [
    { name: "CEO", model: "Claude", used: 0, cap: 30, accent: "text-beige" },
    { name: "CTO", model: "GPT-4", used: 12, cap: 30, accent: "text-violet-rose" },
    { name: "Designer", model: "Gemini", used: 0, cap: 30, accent: "text-cream" },
    { name: "Cursor", model: "Claude", used: 0, cap: 30, accent: "text-beige" },
    { name: "Backend Eng", model: "Claude", used: 0, cap: 30, accent: "text-violet-rose" },
  ];

  return (
    <section className="relative py-24 sm:py-32 border-t border-violet-subtle">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16"
        >
          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-cream">
            Orçamentos.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-violet-muted leading-relaxed max-w-2xl">
            Acompanhe custos por agente, por tarefa, por projeto, por meta. Veja quais agentes são
            caros, quais tarefas consomem tokens, quais projetos estão acima do orçamento.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="p-6 rounded-2xl bg-violet-dark/30 border border-violet-subtle"
        >
          <div className="space-y-2">
            {agents.map((a) => {
              const pct = (a.used / a.cap) * 100;
              return (
                <div key={a.name} className="flex items-center gap-4 p-3 rounded-lg bg-violet-bg/40">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-cream">{a.name}</span>
                      <span className="text-[10px] font-mono text-violet-muted">{a.model}</span>
                    </div>
                    <div className="h-1 rounded-full bg-violet-border overflow-hidden">
                      <div
                        className="h-full bg-beige/60 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-cream">${a.used}</div>
                    <div className="text-[10px] font-mono text-violet-muted">/ ${a.cap}</div>
                  </div>
                </div>
              );
            })}
            {/* Total */}
            <div className="flex items-center justify-between p-3 mt-2 rounded-lg bg-violet-rose/10 border border-violet-rose/20">
              <span className="text-sm font-semibold text-cream">Total</span>
              <div className="text-right">
                <span className="text-sm font-mono text-cream">$12</span>
                <span className="text-[10px] font-mono text-violet-muted ml-1">/ $240</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// === Section: Ticket System ===
export function TicketSystemSection() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-violet-subtle">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16"
        >
          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-cream">
            Sistema de Tickets.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-violet-muted leading-relaxed max-w-2xl">
            Cada conversa traçada. Cada decisão explicada. Você se comunica com agentes através de
            tickets. Nada acontece no escuro.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Ticket mock */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="p-5 rounded-2xl bg-violet-dark/30 border border-violet-subtle"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-violet-muted">#1042</span>
                <span className="text-sm font-semibold text-cream">Deploy da página de preços</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-beige/10 text-beige border border-beige/20">
                Em Progresso
              </span>
            </div>
            {/* conversation */}
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-mono text-violet-rose">CTO · 2 min atrás</div>
                <p className="text-xs text-cream mt-0.5">
                  Fazer o deploy da página de preços atualizada em produção. Rodar testes primeiro.
                </p>
              </div>
              <div>
                <div className="text-[10px] font-mono text-beige">CTO Agent · 1 min atrás</div>
                <p className="text-xs text-cream mt-0.5">
                  Rodando suite de testes e deploy em staging. Vou promover para produção assim que
                  os smoke tests passarem.
                </p>
              </div>
              <div>
                <div className="text-[10px] font-mono text-violet-rose">Você · agora</div>
                <p className="text-xs text-cream mt-0.5">Aprovado. Pode ir.</p>
              </div>
            </div>
            {/* trace */}
            <div className="mt-4 pt-4 border-t border-violet-subtle">
              <div className="text-[10px] font-mono uppercase text-violet-muted mb-2">Trace</div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-violet-muted">run_tests()</span>
                  <span className="text-beige">passou</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-violet-muted">deploy_to_staging()</span>
                  <span className="text-beige">feito</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-violet-muted">smoke_test()</span>
                  <span className="text-beige">passou</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-violet-muted">deploy_to_production()</span>
                  <span className="text-violet-rose">rodando</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Features list */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h3 className="font-serif-display text-lg font-semibold text-cream mb-2">
                Tickets estruturados
              </h3>
              <p className="text-sm text-violet-muted leading-relaxed">
                Cada tarefa é um ticket com responsável claro, status e thread.
              </p>
            </div>
            <div>
              <h3 className="font-serif-display text-lg font-semibold text-cream mb-2">
                Trace completo
              </h3>
              <p className="text-sm text-violet-muted leading-relaxed">
                Cada tool call, request de API e ponto de decisão é logado e visível.
              </p>
            </div>
            <div>
              <h3 className="font-serif-display text-lg font-semibold text-cream mb-2">
                Audit log imutável
              </h3>
              <p className="text-sm text-violet-muted leading-relaxed">
                Histórico append-only. Sem edições, sem deleções. Responsabilidade total.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// === Section: Governance ===
export function GovernanceSection() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-violet-subtle">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-12"
        >
          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-cream">
            Governança.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-violet-muted leading-relaxed max-w-2xl">
            Você está no comando. Aprove contratações. Aprove estratégia. Sobrescreva qualquer coisa.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: Shield,
              title: "Aprovar contratações",
              desc: "Agentes não podem contratar novos agentes sem sua aprovação.",
            },
            {
              icon: Check,
              title: "Aprovar estratégia",
              desc: "O CEO não executa estratégia que você não revisou.",
            },
            {
              icon: ArrowRight,
              title: "Sobrescrever tudo",
              desc: "Pause qualquer agente, reatribua tarefas, ajuste orçamentos — a qualquer momento.",
            },
          ].map((g, i) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-5 rounded-xl bg-violet-dark/30 border border-violet-subtle"
            >
              <div className="w-9 h-9 rounded-lg bg-beige/10 border border-beige/20 flex items-center justify-center mb-3">
                <g.icon className="w-4 h-4 text-beige" />
              </div>
              <h3 className="font-serif-display text-base font-semibold text-cream mb-1.5">
                {g.title}
              </h3>
              <p className="text-xs text-violet-muted leading-relaxed">{g.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// === Section: Open Source + Extensions ===
export function OpenSourceSection() {
  const extensions = [
    { icon: Bell, name: "Alertas Slack", desc: "Seja notificado quando agentes precisam de aprovação" },
    { icon: Shield, name: "Guardrails de Custo", desc: "Pausa automática de agentes que excedem orçamento" },
    { icon: GitBranch, name: "Sync GitHub", desc: "Agentes abrem PRs, você revisa" },
    { icon: Cpu, name: "Heartbeats Customizados", desc: "Defina seus próprios schedules de wake-up" },
    { icon: Webhook, name: "Webhook Bridge", desc: "Conecte o Lovon Teams a qualquer coisa" },
    { icon: Code2, name: "Construa a Sua", desc: "Escreva uma extensão em qualquer linguagem" },
  ];

  return (
    <section className="relative py-24 sm:py-32 border-t border-violet-subtle">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16"
        >
          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-cream">
            Código aberto.
            <br />
            <span className="gradient-text">Extensível, adaptável.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-violet-muted leading-relaxed max-w-2xl">
            Lovon Teams é construído para ser estendido. Adicione capacidades via extensões, adapte
            ao seu stack, e seja dono de cada linha do código que roda sua força de trabalho de IA.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {extensions.map((ext, i) => (
            <motion.div
              key={ext.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="p-4 rounded-xl border border-violet-subtle bg-violet-dark/20 hover:bg-violet-dark/40 transition-all"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <ext.icon className="w-4 h-4 text-beige" />
                <span className="text-sm font-medium text-cream">{ext.name}</span>
              </div>
              <p className="text-[11px] text-violet-muted leading-snug">{ext.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// === Section: Testimonials ===
export function TestimonialsSection() {
  const testimonials = [
    { handle: "@nummanali", text: "Nunca vi um sistema de orquestração de agentes que opera across all business functions. E nenhum construído com tanto bom gosto — design e UX quality como Linear etc. Lovon Teams parece ser especial." },
    { handle: "@JohnHolloway", text: "Ótimo para orquestrar um monte de agentes para fazer dev, conteúdo, social, marketing, QA, pesquisa, outreach e qualquer outra coisa para um biz autônomo." },
    { handle: "@logansaether", text: "Quando comecei a brincar com agentes essa era a visão que eu tinha. Comecei a construir o meu, mas não chega nem perto do polimento desse. Todo mundo deveria experimentar agora." },
    { handle: "@resolvervicky", text: "Um agente é um funcionário, Lovon Teams é a empresa." },
    { handle: "@yashns1", text: "O framing aqui é o que torna isso interessante. Não 'aqui está uma ferramenta de IA'. O CEO contrata um Coder. Você aprova. O mental model é uma empresa que você está rodando, não uma ferramenta que você está usando." },
    { handle: "@iamevandrake", text: "A ascensão de empresas autônomas é inevitável. Testei hoje e mudou minha mente. Sugiro dar uma chance." },
  ];

  return (
    <section className="relative py-24 sm:py-32 border-t border-violet-subtle">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16"
        >
          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-cream">
            O que as pessoas estão dizendo.
          </h2>
          <p className="mt-4 text-base text-violet-muted">Amado por builders.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.handle}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              className="p-5 rounded-xl bg-violet-dark/20 border border-violet-subtle"
            >
              <p className="text-sm text-cream leading-relaxed mb-4">"{t.text}"</p>
              <div className="text-xs font-mono text-violet-rose">{t.handle}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// === Wrapper that exports all sections ===
export function Features({ onLaunch }: Props) {
  return (
    <>
      <GoalsSection />
      <OrgChartSection />
      <BudgetsSection />
      <TicketSystemSection />
      <GovernanceSection />
      <OpenSourceSection />
      <TestimonialsSection />
    </>
  );
}
