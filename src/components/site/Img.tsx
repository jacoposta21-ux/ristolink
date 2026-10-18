/* eslint-disable @next/next/no-img-element */
// Immagine con segnaposto elegante quando la foto non c'è ancora.

export function Img({ src, alt, className = "", eager = false }: { src?: string; alt: string; className?: string; eager?: boolean }) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`bg-gradient-to-br from-[color-mix(in_srgb,var(--primary)_75%,black)] via-[var(--primary)] to-[color-mix(in_srgb,var(--accent)_70%,var(--primary))] ${className}`}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      className={`object-cover ${className}`}
    />
  );
}
