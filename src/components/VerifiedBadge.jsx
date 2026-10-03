import { ShieldCheck } from "lucide-react";

/**
 * Reusable Verified Badge for AnjurXdating.
 * Displays a distinct sky-blue shield check icon for verified profiles.
 */
export default function VerifiedBadge({
  size = 16,
  className = "text-sky-500",
  showText = false,
  text = "Tasdiqlangan",
}) {
  return (
    <span
      title="Tasdiqlangan profil (Verified)"
      className={`inline-flex items-center gap-1 shrink-0 ${className}`}
    >
      <ShieldCheck size={size} className="fill-sky-500/15" />
      {showText && (
        <span className="text-[11px] font-bold tracking-tight">{text}</span>
      )}
    </span>
  );
}
