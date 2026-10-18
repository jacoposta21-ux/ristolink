import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { ClientForm } from "@/components/admin/ClientForm";
import { Card } from "@/components/admin/ui";
import { createClientAction } from "../../../actions";
import { ROOT_DOMAIN } from "@/lib/env";

export const metadata = { title: "Nuovo cliente" };

export default async function NewClientPage() {
  const { supabase } = await requireAdmin();
  const settings = await getSettings(supabase);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Nuovo cliente</h1>
      <p className="text-sm text-neutral-600">
        Crea il cliente: il sito viene generato subito con testi di esempio del template scelto. Poi lo personalizzi e invii il link di pagamento.
      </p>
      <Card>
        <ClientForm action={createClientAction} rootDomain={ROOT_DOMAIN} defaultTrialDays={settings.default_trial_days} />
      </Card>
    </div>
  );
}
