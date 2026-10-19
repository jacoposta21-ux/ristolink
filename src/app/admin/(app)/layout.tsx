import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, LogOut, PhoneCall, Plus, Settings } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: { default: "Dashboard — EasySito", template: "%s — EasySito Admin" },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/", label: "Clienti", icon: LayoutDashboard },
  { href: "/richiamare", label: "Da richiamare", icon: PhoneCall },
  { href: "/impostazioni", label: "Impostazioni", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, supabase } = await requireAdmin();
  const { count } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("stato", "in_ritardo")
    .is("archived_at", null);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-900 text-sm font-bold text-white">E</span>
            <span className="hidden sm:inline">EasySito</span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
                {href === "/richiamare" && !!count && (
                  <span className="rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white">{count}</span>
                )}
              </Link>
            ))}
          </nav>
          <Link
            href="/clienti/nuovo"
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nuovo cliente</span>
          </Link>
          <form action={logout}>
            <button title={`Esci (${user.email})`} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
