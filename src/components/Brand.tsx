import { cn } from "@/lib/cn";

// BASE_URL respeita o subdiretório "/JurisControle/" usado no GitHub Pages.
const logoSrc = `${import.meta.env.BASE_URL}logo-512.png`;

/** Logotipo do JurisControle (monograma JC com balança da justiça). */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <img
      src={logoSrc}
      width={size}
      height={size}
      alt="JurisControle"
      className="shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

export function Brand({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Logo size={40} />
      <div className="leading-tight">
        <div className={cn("font-serif text-lg font-bold", dark ? "text-white" : "text-ink")}>
          JurisControle
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
          Gestão Jurídica
        </div>
      </div>
    </div>
  );
}
