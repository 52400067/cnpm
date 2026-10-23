import Link from "next/link";

interface LogoProps {
  className?: string;
  /** "full" = icon + wordmark (default), "icon" = icon only, "wordmark" = text only */
  variant?: "full" | "icon" | "wordmark";
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, variant = "full", size = "md" }: LogoProps) {
  const sizeMap = {
    sm: { boxSize: 28, textClass: "text-[14px]", padding: "px-2 py-1",     iconScale: 0.55 },
    md: { boxSize: 36, textClass: "text-[17px]", padding: "px-2.5 py-1.5", iconScale: 0.55 },
    lg: { boxSize: 44, textClass: "text-[21px]", padding: "px-3 py-2",     iconScale: 0.55 },
  };
  const s = sizeMap[size];
  const iconSize = Math.round(s.boxSize * s.iconScale);

  return (
    <Link
      href="/"
      aria-label="TicketHub — Trang chủ mua vé sự kiện"
      className={`inline-flex items-center gap-2 select-none group transition-opacity hover:opacity-90 ${className ?? ""}`}
    >
      {/* Ticket icon mark */}
      {(variant === "full" || variant === "icon") && (
        <div
          className={`relative inline-flex items-center justify-center rounded-[10px] bg-primary text-white shadow-lg group-hover:shadow-primary/40 group-hover:bg-emerald-700 transition-all duration-200 ${s.padding}`}
          style={{ width: s.boxSize, height: s.boxSize }}
          aria-hidden="true"
        >
          {/* SVG ticket icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
          >
            <path
              d="M14.5 9.5C13.95 9.5 13.5 9.05 13.5 8.5V6C13.5 5.45 13.05 5 12.5 5H4.5C3.95 5 3.5 5.45 3.5 6V10C3.5 10.55 3.95 11 4.5 11C5.05 11 5.5 11.45 5.5 12C5.5 12.55 5.05 13 4.5 13C3.95 13 3.5 13.45 3.5 14V18C3.5 18.55 3.95 19 4.5 19H12.5C13.05 19 13.5 18.55 13.5 18V15.5C13.5 14.95 13.95 14.5 14.5 14.5C15.05 14.5 15.5 14.95 15.5 15.5V18C15.5 18.55 15.95 19 16.5 19H19.5C20.05 19 20.5 18.55 20.5 18V14C20.5 13.45 20.05 13 19.5 13C18.95 13 18.5 12.55 18.5 12C18.5 11.45 18.95 11 19.5 11C20.05 11 20.5 10.55 20.5 10V6C20.5 5.45 20.05 5 19.5 5H16.5C15.95 5 15.5 5.45 15.5 6V8.5C15.5 9.05 15.05 9.5 14.5 9.5Z"
              fill="currentColor"
              fillOpacity="0.95"
            />
            {/* Perforation dashes */}
            <line
              x1="13.5" y1="9.5" x2="13.5" y2="14.5"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1"
              strokeDasharray="1.5 1.5"
            />
          </svg>

          {/* Hover glow ring */}
          <span className="absolute inset-0 rounded-[10px] ring-2 ring-primary/0 group-hover:ring-primary/40 transition-all duration-300" />
        </div>
      )}

      {/* Wordmark */}
      {(variant === "full" || variant === "wordmark") && (
        <span className={`font-extrabold tracking-[-0.03em] leading-none text-foreground ${s.textClass}`}>
          Ticket<span className="text-primary">Hub</span>
        </span>
      )}
    </Link>
  );
}
