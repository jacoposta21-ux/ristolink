"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { ActionState } from "@/app/admin/actions";

/**
 * Come useActionState, ma senza il reset automatico del form di React 19:
 * se il server risponde con un errore, quanto digitato resta nei campi.
 */
export function useNoResetAction(action: (state: ActionState, form: FormData) => Promise<ActionState>) {
  const [state, dispatch, pending] = useActionState(action, undefined);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };
  return [state, onSubmit, pending] as const;
}
