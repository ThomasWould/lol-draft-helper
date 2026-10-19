import { useState } from "react";

export function GameIcon({
  src,
  label,
  className = "",
}: {
  src?: string;
  label: string;
  className?: string;
}) {
  const [failed, setFailed] = useState<string>();
  const initials = label
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  return (
    <span className={`gameIcon ${className}`} aria-hidden="true">
      {src && failed !== src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(src)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}
