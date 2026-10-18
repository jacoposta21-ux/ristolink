"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className, pendingLabel = "Salvataggio…" }: {
  children: React.ReactNode;
  className: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}
