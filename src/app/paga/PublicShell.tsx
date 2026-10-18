export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-neutral-100 to-white px-4 py-10">
      <div className="w-full max-w-md">
        {children}
        <p className="mt-6 text-center text-xs text-neutral-500">
          MioSitoVeloce · pagamenti sicuri gestiti da Stripe · <a href="/privacy" className="underline">Privacy</a>
        </p>
      </div>
    </main>
  );
}
