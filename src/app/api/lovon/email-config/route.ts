import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Returns PUBLIC (non-secret) email configuration so the UI can warn the user
// when they're still using the Resend sandbox sender (onboarding@resend.dev),
// which can ONLY deliver to the account owner's email.
//
// NEVER expose the API key here.
export async function GET() {
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const fromName = process.env.RESEND_FROM_NAME ?? "Lovon Teams";
  const isSandbox = fromEmail.toLowerCase() === "onboarding@resend.dev";

  return NextResponse.json({
    fromEmail,
    fromName,
    isSandbox,
    warning: isSandbox
      ? "Você está usando o domínio sandbox do Resend (onboarding@resend.dev). E-mails SÓ podem ser entregues ao dono da conta. Para enviar para clientes reais, configure um domínio próprio em https://resend.com/domains e defina RESEND_FROM_EMAIL no arquivo .env."
      : null,
  });
}
