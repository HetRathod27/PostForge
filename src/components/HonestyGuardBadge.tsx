import React from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";

interface HonestyGuardBadgeProps {
  addedClaims: string[];
  usedFactIdsCount: number;
}

export const HonestyGuardBadge: React.FC<HonestyGuardBadgeProps> = ({
  addedClaims,
  usedFactIdsCount,
}) => {
  const isGrounded = !addedClaims || addedClaims.length === 0;

  if (isGrounded) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium shrink-0"
        title={`All claims in this post are grounded in ${usedFactIdsCount} verified facts.`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="whitespace-nowrap">100% Grounded</span>
        <span className="hidden xs:inline text-[10px] text-emerald-600 dark:text-emerald-400/90 font-mono">
          ({usedFactIdsCount} facts)
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-medium shrink-0"
      title={`${addedClaims.length} statements were added that were not in your enabled facts.`}
    >
      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
      <span className="whitespace-nowrap">
        {addedClaims.length} Unverified
        <span className="hidden xs:inline"> Claim{addedClaims.length > 1 ? "s" : ""}</span>
      </span>
    </div>
  );
};

export function highlightGroundedText(
  text: string,
  addedClaims: string[],
  onRemoveClaim: (claim: string) => void
): React.ReactNode {
  if (!text) return null;
  if (!addedClaims || addedClaims.length === 0) {
    return <span>{text}</span>;
  }

  // Find occurrences of added claims within the text
  // We can do a case-insensitive search or exact search
  let remaining = text;
  const elements: React.ReactNode[] = [];
  let keyIdx = 0;

  // Sort claims by length descending to match longest matches first
  const sortedClaims = [...addedClaims].filter(Boolean).sort((a, b) => b.length - a.length);

  for (const claim of sortedClaims) {
    const claimTrim = claim.trim();
    if (!claimTrim) continue;

    const lowerText = remaining.toLowerCase();
    const lowerClaim = claimTrim.toLowerCase();
    const foundPos = lowerText.indexOf(lowerClaim);

    if (foundPos !== -1) {
      const before = remaining.substring(0, foundPos);
      const matchText = remaining.substring(foundPos, foundPos + claimTrim.length);
      remaining = remaining.substring(foundPos + claimTrim.length);

      if (before) {
        elements.push(<span key={`text-${keyIdx++}`}>{before}</span>);
      }

      elements.push(
        <span
          key={`claim-${keyIdx++}`}
          className="relative inline bg-amber-200/70 dark:bg-amber-500/25 border-b-2 border-amber-500 dark:border-amber-400 text-amber-950 dark:text-amber-200 px-1 py-0.5 rounded font-medium group"
        >
          {matchText}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveClaim(claim);
            }}
            className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500 hover:bg-amber-600 text-neutral-950 transition-colors shadow-xs cursor-pointer align-baseline"
            title="Remove this unverified claim from post"
          >
            Remove claim
          </button>
        </span>
      );
    }
  }

  if (remaining) {
    elements.push(<span key={`text-end-${keyIdx++}`}>{remaining}</span>);
  }

  return elements.length > 0 ? <>{elements}</> : <span>{text}</span>;
}
