// P0: Version endpoint — returns build time stamp so the client can
// detect when a new version has been deployed and show a "refresh" banner.
// The buildId is the file mtime of this route (or a hash of git commit).
// We compute it once at server start and cache it.

import { NextResponse } from "next/server";
import { statSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let cachedBuildId: string | null = null;
let cachedDeployedAt: string | null = null;

function computeBuildId(): { buildId: string; deployedAt: string } {
  if (cachedBuildId && cachedDeployedAt) {
    return { buildId: cachedBuildId, deployedAt: cachedDeployedAt };
  }
  try {
    // Use mtime of this file as a stable build identifier.
    // Each deploy replaces this file → new mtime → new buildId.
    const filePath = join(process.cwd(), "src", "app", "api", "version", "route.ts");
    const stats = statSync(filePath);
    cachedBuildId = stats.mtime.toISOString();
    cachedDeployedAt = stats.mtime.toISOString();
  } catch {
    // Fallback: use current time at server start
    if (!cachedBuildId) {
      cachedBuildId = new Date().toISOString();
      cachedDeployedAt = cachedBuildId;
    }
  }
  return { buildId: cachedBuildId, deployedAt: cachedDeployedAt };
}

export async function GET() {
  const { buildId, deployedAt } = computeBuildId();
  return NextResponse.json(
    { buildId, deployedAt },
    {
      headers: {
        // Never cache this endpoint — it must always reflect current build
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}
