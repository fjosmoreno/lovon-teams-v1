"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  Check,
  FileText,
  Tag,
  Clock,
} from "lucide-react";
import { useLovonStore, KBDocument } from "@/lib/lovon/store";

const CATEGORIES = [
  "FAQ",
  "Política",
  "Pricing",
  "Case",
  "Contrato",
  "Guia técnico",
  "Pitch",
  "Objeções de venda",
  "Outro",
];

export function KnowledgeBase() {
  const knowledgeBase = useLovonStore((s) => s.knowledgeBase);
  const addKBDocument = useLovonStore((s) => s.addKBDocument);
  const updateKBDocument = useLovonStore((s) => s.updateKBDocument);
  const deleteKBDocument = useLovonStore((s) => s.deleteKBDocument);
  const approveKBDocument = useLovonStore((s) => s.approveKBDocument);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingDoc, setEditingDoc] = useState<KBDocument | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = knowledgeBase.filter((d) => {
    if (filterCategory !== "all" && d.category !== filterCategory) return false;
    if (search) {
      const lower = search.toLowerCase();
      return (
        d.title.toLowerCase().includes(lower) ||
        d.content.toLowerCase().includes(lower) ||
        d.tags.some((t) => t.toLowerCase().includes(lower))
      );
    }
    return true;
  });

  const stats = {
    total: knowledgeBase.length,
    categories: new Set(knowledgeBase.map((d) => d.category)).size,
    words: knowledgeBase.reduce((sum, d) => sum + d.content.split(/\s+/).length, 0),
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-beige" />
            <h1 className="text-2xl sm:text-3xl font-bold text-cream font-serif-display">Knowledge Base</h1>
          </div>
          <p className="text-sm text-violet-muted max-w-2xl">
            Camada D — Documentos recuperáveis via RAG. Os agentes buscam aqui quando precisam de contexto específico (FAQ, políticas, pricing, cases, contratos, etc.).
          </p>
        </div>
        <button
          onClick={() => { setEditingDoc(null); setShowForm(true); }}
          className="btn-pill btn-primary-neon text-sm"
        >
          <Plus className="w-4 h-4" /> Novo documento
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl glass border border-violet-subtle">
          <FileText className="w-4 h-4 text-beige mb-2" />
          <div className="text-xl font-bold text-cream">{stats.total}</div>
          <div className="text-[10px] text-violet-muted uppercase">Documentos</div>
        </div>
        <div className="p-4 rounded-xl glass border border-violet-subtle">
          <Tag className="w-4 h-4 text-neon-blue mb-2" />
          <div className="text-xl font-bold text-cream">{stats.categories}</div>
          <div className="text-[10px] text-violet-muted uppercase">Categorias</div>
        </div>
        <div className="p-4 rounded-xl glass border border-violet-subtle">
          <BookOpen className="w-4 h-4 text-neon-purple mb-2" />
          <div className="text-xl font-bold text-cream">{stats.words.toLocaleString("pt-BR")}</div>
          <div className="text-[10px] text-violet-muted uppercase">Palavras</div>
        </div>
      </div>

      {/* filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-muted" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream placeholder:text-violet-muted focus:outline-none focus:border-beige/30"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
        >
          <option value="all">Todas as categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 mx-auto text-violet-muted/30 mb-3" />
          <p className="text-sm text-violet-muted mb-4">
            {knowledgeBase.length === 0
              ? "Nenhum documento na base de conhecimento ainda."
              : "Nenhum resultado para o filtro aplicado."}
          </p>
          <button
            onClick={() => { setEditingDoc(null); setShowForm(true); }}
            className="btn-pill btn-primary-neon text-sm"
          >
            <Plus className="w-4 h-4" /> Adicionar primeiro documento
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="p-4 rounded-xl glass border border-violet-subtle group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-beige/10 text-beige border border-beige/20">
                      {doc.category}
                    </span>
                    {doc.approved ? (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Aprovado
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#ff8a3d]/10 text-[#ff8a3d] border border-[#ff8a3d]/20">
                        Pendente
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-cream truncate">{doc.title}</h4>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!doc.approved && (
                    <button
                      onClick={() => approveKBDocument(doc.id)}
                      className="w-7 h-7 rounded-md bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20 flex items-center justify-center"
                      title="Aprovar documento"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingDoc(doc); setShowForm(true); }}
                    className="w-7 h-7 rounded-md bg-white/5 border border-white/8 text-violet-muted hover:text-beige flex items-center justify-center"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteKBDocument(doc.id)}
                    className="w-7 h-7 rounded-md bg-white/5 border border-white/8 text-violet-muted hover:text-red-400 flex items-center justify-center"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-violet-muted line-clamp-3 mb-2">{doc.content}</p>
              {doc.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {doc.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-bg/40 text-violet-muted border border-violet-subtle">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 mt-2 text-[9px] text-violet-muted/60 font-mono">
                <Clock className="w-2.5 h-2.5" />
                {new Date(doc.updatedAt).toLocaleDateString("pt-BR")}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* form modal */}
      <AnimatePresence>
        {showForm && (
          <KBDocumentForm
            doc={editingDoc}
            onClose={() => { setShowForm(false); setEditingDoc(null); }}
            onSave={(data) => {
              if (editingDoc) {
                updateKBDocument(editingDoc.id, data);
              } else {
                addKBDocument({ ...data, approved: false, version: 1, visibility: "all" as const });
              }
              setShowForm(false);
              setEditingDoc(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function KBDocumentForm({
  doc,
  onClose,
  onSave,
}: {
  doc: KBDocument | null;
  onClose: () => void;
  onSave: (data: { title: string; category: string; content: string; tags: string[] }) => void;
}) {
  const [title, setTitle] = useState(doc?.title ?? "");
  const [category, setCategory] = useState(doc?.category ?? "FAQ");
  const [content, setContent] = useState(doc?.content ?? "");
  const [tagsInput, setTagsInput] = useState(doc?.tags.join(", ") ?? "");

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSave({ title: title.trim(), category, content: content.trim(), tags });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl glass-strong border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between p-5 border-b border-violet-subtle">
          <div>
            <h3 className="text-base font-semibold text-cream font-serif-display">
              {doc ? "Editar documento" : "Novo documento"}
            </h3>
            <p className="text-xs text-violet-muted mt-0.5">
              Será recuperado automaticamente quando relevante para uma task.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-4">
          <div>
            <label className="text-xs font-medium text-violet-muted mb-1.5 block">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Política de reembolso"
              className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream placeholder:text-violet-muted focus:outline-none focus:border-beige/30"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-violet-muted mb-1.5 block">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-violet-muted mb-1.5 block">Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Conteúdo completo do documento. Pode conter múltiplas linhas, listas, etc."
              rows={10}
              className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream placeholder:text-violet-muted focus:outline-none focus:border-beige/30 resize-y font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-violet-muted mb-1.5 block">Tags (separadas por vírgula)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ex: reembolso, cancelamento, 7 dias"
              className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream placeholder:text-violet-muted focus:outline-none focus:border-beige/30"
            />
          </div>
        </div>

        {/* footer */}
        <div className="p-4 border-t border-violet-subtle flex items-center justify-between">
          <span className="text-[10px] font-mono text-violet-muted">
            {content.split(/\s+/).filter(Boolean).length} palavras
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-violet-muted hover:text-cream"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !content.trim()}
              className="btn-pill btn-primary-neon text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-3.5 h-3.5" /> Salvar documento
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
