import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("lovon-session");
  if (!cookie?.value) {
    return NextResponse.json({ user: null });
  }
  try {
    const session = JSON.parse(cookie.value);
    return NextResponse.json({
      user: { id: session.id, email: session.email, name: session.name },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
