/* File: PerplexityTestPage.tsx */
import React from "react";
import "./perplexity.css"; // ➜ see the small CSS sheet further down

// 1️⃣  Button component -------------------------------------------------------
type Variant = "primary" | "secondary" | "subtle" | "danger" | "link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const Button: React.FC<ButtonProps> = ({ variant = "primary", className = "", children, ...rest }) => (
  <button className={`pxy-button pxy-${variant} ${className}`} {...rest}>
    {children}
  </button>
);

// 2️⃣  Test page --------------------------------------------------------------
const PerplexityTestPage: React.FC = () => {
  const variants: Variant[] = ["primary", "secondary", "subtle", "danger", "link"];

  return (
    <div className="pxy-wrapper">
      <h1 className="pxy-heading">Perplexity Button Showcase</h1>

      <ul className="pxy-list">
        {variants.map((v) => (
          <li key={v}>
            <Button variant={v}>{v.charAt(0).toUpperCase() + v.slice(1)} button</Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PerplexityTestPage;
