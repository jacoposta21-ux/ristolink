import type { CSSProperties } from "react";
import type { SiteProps } from "./types";
import { Ristorante } from "./templates/Ristorante";
import { Beauty } from "./templates/Beauty";
import { Negozio } from "./templates/Negozio";
import { Artigiano } from "./templates/Artigiano";

const TEMPLATES = { ristorante: Ristorante, beauty: Beauty, negozio: Negozio, artigiano: Artigiano };

export function SiteRenderer(props: SiteProps) {
  const T = TEMPLATES[props.template] ?? Ristorante;
  const style = { "--primary": props.content.theme.primary, "--accent": props.content.theme.accent } as CSSProperties;
  return (
    <div style={style}>
      <T {...props} />
    </div>
  );
}
