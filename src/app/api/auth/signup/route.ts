import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, nome e senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: { email, name, passwordHash },
    });

    // Set session cookie (simple: store user id + email + name)
    const session = JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
    res.cookies.set("lovon-session", session, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[/api/auth/signup] error:", err);
    return NextResponse.json(
      { error: "Erro interno ao cadastrar" },
      { status: 500 }
    );
  }
}
