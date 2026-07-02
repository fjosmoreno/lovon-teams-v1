"use client";

import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Zap, Clock } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const CALLS_DATA = [
  { day: "Seg", calls: 842, cost: 0 },
  { day: "Ter", calls: 1024, cost: 0 },
  { day: "Qua", calls: 1187, cost: 0 },
  { day: "Qui", calls: 963, cost: 0 },
  { day: "Sex", calls: 1284, cost: 0 },
  { day: "Sáb", calls: 712, cost: 0 },
  { day: "Dom", calls: 534, cost: 0 },
];

const PROVIDER_DATA = [
  { name: "Gemini Flash", value: 612, color: "#00F5A0" },
  { name: "Groq Llama 70B", value: 318, color: "#00E0FF" },
  { name: "OpenRouter Free", value: 192, color: "#a855f7" },
  { name: "Ollama Local", value: 124, color: "#ff8a3d" },
  { name: "GPT-4.1 (fallback)", value: 38, color: "#b6ff3d" },
];

const LATENCY_DATA = [
  { time: "00h", latency: 287 },
  { time: "04h", latency: 245 },
  { time: "08h", latency: 312 },
  { time: "12h", latency: 298 },
  { time: "16h", latency: 267 },
  { time: "20h", latency: 234 },
  { time: "agora", latency: 287 },
];

const STATS = [
  { label: "Total de chamadas", value: "6.546", delta: "+18% vs semana", icon: TrendingUp, accent: "text-neon-green" },
  { label: "Custo total", value: "R$ 0,00", delta: "100% free tier", icon: DollarSign, accent: "text-neon-blue" },
  { label: "Latência média", value: "287ms", delta: "-12ms vs semana", icon: Clock, accent: "text-neon-purple" },
  { label: "Taxa de sucesso", value: "99.97%", delta: "1 fallback acionado", icon: Zap, accent: "text-[#b6ff3d]" },
];

export function AnalyticsView() {
  return (
    <div className="space-y-6 max-w-7xl">
      {/* header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-tech-gray mt-1">Métricas em tempo real · Últimos 7 dias</p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-5 rounded-2xl glass border border-white/8"
          >
            <div className={`w-9 h-9 rounded-lg glass flex items-center justify-center ${s.accent} mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-tech-gray mt-1">{s.label}</div>
            <div className={`text-[10px] mt-1 font-mono ${s.accent}`}>{s.delta}</div>
          </motion.div>
        ))}
      </div>

      {/* charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* calls chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass border border-white/8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-white">Chamadas por dia</h3>
              <p className="text-xs text-tech-gray">Últimos 7 dias</p>
            </div>
            <div className="text-[10px] font-mono text-neon-green">FREE TIER</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={CALLS_DATA}>
              <defs>
                <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F5A0" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00F5A0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 15, 24, 0.95)",
                  border: "1px solid rgba(0,245,160,0.3)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="calls"
                stroke="#00F5A0"
                strokeWidth={2}
                fill="url(#callsGrad)"
                dot={{ fill: "#00F5A0", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* provider pie */}
        <div className="p-6 rounded-2xl glass border border-white/8">
          <h3 className="text-base font-semibold text-white mb-5">Distribuição</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={PROVIDER_DATA}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={45}
                paddingAngle={3}
              >
                {PROVIDER_DATA.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.color}
                    stroke="rgba(10,10,15,0.6)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 15, 24, 0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {PROVIDER_DATA.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: p.color }}
                  />
                  <span className="text-white truncate">{p.name}</span>
                </div>
                <span className="text-tech-gray font-mono">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* latency */}
        <div className="p-6 rounded-2xl glass border border-white/8">
          <h3 className="text-base font-semibold text-white mb-5">Latência (ms)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={LATENCY_DATA}>
              <XAxis dataKey="time" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 15, 24, 0.95)",
                  border: "1px solid rgba(0,224,255,0.3)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="latency"
                stroke="#00E0FF"
                strokeWidth={2}
                dot={{ fill: "#00E0FF", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* cost by agent */}
        <div className="p-6 rounded-2xl glass border border-white/8">
          <h3 className="text-base font-semibold text-white mb-5">Chamadas por agente</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[
                { name: "CEO", calls: 184 },
                { name: "Sales", calls: 1240 },
                { name: "Support", calls: 2890 },
                { name: "Code", calls: 412 },
                { name: "Marketing", calls: 870 },
                { name: "Research", calls: 320 },
                { name: "Ops", calls: 630 },
              ]}
              layout="vertical"
            >
              <XAxis type="number" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#A1A1AA"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 15, 24, 0.95)",
                  border: "1px solid rgba(168,85,247,0.3)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar dataKey="calls" radius={[0, 6, 6, 0]}>
                {["#00F5A0", "#00E0FF", "#a855f7", "#b6ff3d", "#ff8a3d", "#00F5A0", "#00E0FF"].map((c, i) => (
                  <Cell key={i} fill={c} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
