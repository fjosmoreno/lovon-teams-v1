import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/lovon/agent-engine/types";
import {
  validateWorkProduct,
  WorkProduct,
  WorkProductType,
} from "@/lib/lovon/work-products";
import { useLovonStore } from "@/lib/lovon/store";

export const runtime = "nodejs";
export const maxDuration = 30;

interface CreateWorkProductRequest {
  workspaceId: string;
  traceId?: string;
  createdBy: { kind: "agent"; agentSlug: string };
  sourceTaskId: string; // link obrigatório
  type: WorkProductType;
  payload: unknown; // JSON do work product
  idempotencyKey?: string;
}

// In-memory idempotency cache (24h TTL)
const IDEMPOTENCY_CACHE = new Map<string, { workProductId: string; insertedAt: number }>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function pruneCache(): void {
  const now = Date.now();
  for (const [key, entry] of IDEMPOTENCY_CACHE) {
    if (now - entry.insertedAt > IDEMPOTENCY_TTL_MS) {
      IDEMPOTENCY_CACHE.delete(key);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateWorkProductRequest;
    const { workspaceId, traceId, createdBy, sourceTaskId, type, payload, idempotencyKey } = body;

    if (!workspaceId || !createdBy?.agentSlug || !sourceTaskId || !type || !payload) {
      return NextResponse.json(
        { success: false, error: "workspaceId, createdBy.agentSlug, sourceTaskId, type e payload são obrigatórios" },
        { status: 400 }
      );
    }

    // === Idempotency check ===
    if (idempotencyKey) {
      pruneCache();
      const cached = IDEMPOTENCY_CACHE.get(idempotencyKey);
      if (cached) {
        return NextResponse.json({
          success: true,
          workProductId: cached.workProductId,
          idempotent: true,
          message: "Work product já existente (idempotency hit) — não foi criado novamente.",
        });
      }
    }

    // === Validate that the source task exists ===
    const sourceTask = useLovonStore.getState().tasks.find((t) => t.id === sourceTaskId);
    if (!sourceTask) {
      return NextResponse.json(
        { success: false, error: `sourceTaskId "${sourceTaskId}" não encontrado. Work products devem estar linkados a uma task existente.` },
        { status: 400 }
      );
    }

    // === Validate the payload against the Zod schema ===
    const now = new Date().toISOString();
    const workProductId = `wp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const fullPayload = {
      ...(payload as object),
      meta: {
        id: workProductId,
        workspaceId,
        type,
        version: "1.0",
        status: "draft",
        createdAt: now,
        createdBy: { kind: "agent" as const, agentSlug: createdBy.agentSlug },
        sourceTaskId,
        tags: [],
        ...((payload as { meta?: object })?.meta ?? {}),
      },
    };

    const validation = validateWorkProduct(fullPayload);
    if (!validation.success) {
      appendAuditEvent({
        workspaceId,
        type: "TASK_CREATED" as never,
        actor: { kind: "agent", id: createdBy.agentSlug },
        traceId: traceId ?? `wp-create-${workProductId}`,
        payload: {
          event: "work_product_validation_failed",
          sourceTaskId,
          type,
          error: validation.error?.slice(0, 500),
        },
      });

      return NextResponse.json(
        { success: false, error: `Work product falhou na validação Zod: ${validation.error}`, validationError: validation.error },
        { status: 400 }
      );
    }

    const workProduct = validation.data as WorkProduct;

    // === Persist via the store action ===
    useLovonStore.getState().addWorkProduct(workProduct);

    // === Audit ===
    try {
      appendAuditEvent({
        workspaceId,
        type: "TASK_CREATED" as never,
        actor: { kind: "agent", id: createdBy.agentSlug },
        traceId: traceId ?? `wp-create-${workProductId}`,
        payload: {
          event: "work_product_created",
          workProductId,
          sourceTaskId,
          type,
          status: workProduct.meta.status,
        },
      });
    } catch (e) {
      console.warn("[work-products/create] failed to write audit event", e);
    }

    // === Cache for idempotency ===
    if (idempotencyKey) {
      IDEMPOTENCY_CACHE.set(idempotencyKey, { workProductId, insertedAt: Date.now() });
    }

    return NextResponse.json({
      success: true,
      workProductId,
      workProduct,
      sourceTaskId,
      type,
    });
  } catch (err) {
    console.error("[/api/lovon/work-products/create] error:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// GET — list work products for a task
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const taskId = url.searchParams.get("taskId");
  const type = url.searchParams.get("type") as WorkProductType | null;

  if (!taskId) {
    return NextResponse.json(
      { success: false, error: "taskId é obrigatório como query param" },
      { status: 400 }
    );
  }

  let wps = useLovonStore.getState().workProducts.filter((wp) => wp.meta.sourceTaskId === taskId);
  if (type) {
    wps = wps.filter((wp) => wp.meta.type === type);
  }

  return NextResponse.json({ success: true, count: wps.length, workProducts: wps });
}
