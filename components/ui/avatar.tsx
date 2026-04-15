"use client";

import * as React from "react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  className?: string;
}

export function Avatar({ src, alt = "", fallback = "", className = "" }: AvatarProps) {
  const [error, setError] = React.useState(false);
  const fallbackText = fallback.slice(0, 2) || "?";

  return (
    <div
      className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ${className}`}
    >
      {src && !error ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span className="text-sm font-medium text-muted-foreground uppercase">
          {fallbackText}
        </span>
      )}
    </div>
  );
}
