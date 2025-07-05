/* File: PerplexityBadgePage.tsx */
import React from "react";
import "./perplexity-badges.css"; // ← full token sheet further down

type Variant = "primary" | "sky" | "earth" | "neutral" | "danger";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const Badge: React.FC<BadgeProps> = ({ variant = "primary", className = "", children, ...rest }) => (
  <span className={`pxy-badge pxy-${variant} ${className}`} {...rest}>
    {children}
  </span>
);

const PerplexityBadgePage: React.FC = () => {
  const variants: Variant[] = ["primary", "sky", "earth", "neutral", "danger"];

  return (
    <div className="pxy-wrapper">
      <h1 className="pxy-heading">Perplexity Badge Showcase</h1>

      <ul className="pxy-list">
        {variants.map((v) => (
          <li key={v}>
            <Badge variant={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PerplexityBadgePage;
