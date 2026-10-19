import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Accedi — EasySito Admin", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ errore?: string }> }) {
  const { errore } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.svg" alt="" className="mx-auto mb-3 h-12 w-12" />
          <h1 className="text-xl font-semibold">EasySito Admin</h1>
          <p className="text-sm text-neutral-500">Accesso riservato</p>
        </div>
        {errore === "non-autorizzato" && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Questo account non è autorizzato. Aggiungilo alla tabella <code>admins</code> (vedi README).
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
