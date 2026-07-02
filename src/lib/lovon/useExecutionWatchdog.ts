"use client";

// P0: Client-side execution watchdog — catches tasks stuck in "in_progress"
// because the server-side setTimeout was lost on Render free tier cold starts.
// The client polls every 30s. For each in_progress task, it checks if the
// most recent activity log is older than MAX_STUCK_MS. If yes, force-blocks
// the task with a clear error message.

import { useEffect } from "react";
import { useLovonStore } from "@/lib/lovon/store";

const POLL_INTERVAL_MS = 30_000; // 30 seconds
const MAX_STUCK_MS = 3 * 60 * 1000; // 3 minutes

export function useExecutionWatchdog() {
  const tasks = useLovonStore((s) => s.tasks);
  const activity = useLovonStore((s) => s.activity);

  useEffect(() => {
    function checkStuckTasks() {
      const now = Date.now();
      const inProgress = tasks.filter(
        (t) => t.status === "in_progress" || t.status === "working"
      );
      if (inProgress.length === 0) return;

      for (const task of inProgress) {
        // Find most recent activity for this task
        const lastActivity = activity.find((a) => a.taskId === task.id);
        const lastActivityTime = lastActivity?.timestamp ?? task.updatedAt ?? 0;
        const elapsed = now - lastActivityTime;

        if (elapsed > MAX_STUCK_MS) {
          // Task is stuck — force-block it
          console.warn(
            `[watchdog-client] task "${task.title}" stuck for ${Math.round(elapsed / 1000)}s. Force-blocking.`
          );
          useLovonStore.getState().setTaskBlockers(task.id, [
            {
              code: "LLM_FAILED",
              message: `⏳ Task travou em execução por mais de 3 minutos sem progresso. Provavelmente LLM hung ou cold-start matou o server-side watchdog.`,
              requiredAction: `Verifique se o provider LLM está respondendo (Integrações → Testar). Considere trocar de modelo ou adicionar uma segunda key. Re-execute a task.`,
              relatedEntity: { type: "task", id: task.id },
              createdAt: new Date().toISOString(),
              createdBy: "client-watchdog",
              traceId: `watchdog-client:${task.id}`,
            },
          ]);
          // Force status change (setTaskBlockers sets "blocked" but only if there's no status already)
          useLovonStore.setState((s) => ({
            tasks: s.tasks.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    status: "blocked" as const,
                    result: `${t.result ?? ""}\n\n⚠ Watchdog cliente: execução excedeu 3 minutos sem progresso.`,
                    updatedAt: Date.now(),
                  }
                : t
            ),
            agents: s.agents.map((a) =>
              a.currentTaskId === task.id
                ? { ...a, status: "active" as const, currentTaskId: null }
                : a
            ),
          }));
          useLovonStore.getState().logActivity({
            agentId: "system",
            agentName: "Sistema",
            action: "failed",
            message: `🛑 Watchdog cliente: task "${task.title}" travou por >3min. Marcada como bloqueada.`,
            taskId: task.id,
            accent: "orange",
          });
        }
      }
    }

    // Run once on mount + every 30s
    checkStuckTasks();
    const interval = setInterval(checkStuckTasks, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [tasks, activity]);
}