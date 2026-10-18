"use client";

import { useNoResetAction } from "@/components/admin/useNoResetAction";
import { login } from "../actions";
import { inputCls, btnPrimary } from "@/components/admin/ui";

export function LoginForm() {
  const [state, onSubmit, pending] = useNoResetAction(login);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input name="email" type="email" required autoComplete="email" placeholder="Email" className={inputCls} />
      <input name="password" type="password" required autoComplete="current-password" placeholder="Password" className={inputCls} />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? "Accesso…" : "Accedi"}
      </button>
    </form>
  );
}
