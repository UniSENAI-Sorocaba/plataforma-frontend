import type { Metadata } from "next";
import { PasswordRecoveryForm } from "@/features/auth/password-recovery-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recuperação de Senha | UniSENAI Sorocaba",
  description: "Recupere o acesso à Plataforma Acadêmica Digital do UniSENAI Sorocaba.",
};

export default function RecuperarSenhaPage() {
  return (
    <main className="recovery-page">
      <PasswordRecoveryForm />
    </main>
  );
}
