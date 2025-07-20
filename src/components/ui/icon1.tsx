import React from "react";

interface Icon1Props {
  className?: string;
}

export function Icon1({ className = "" }: Icon1Props) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export default Icon1;