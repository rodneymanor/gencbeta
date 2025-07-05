/* File: PerplexityCardPage.tsx */
import React from "react";
import "./perplexity-cards.css"; // full token sheet below

type Variant = "default" | "highlight" | "info";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  variant?: Variant;
}

const Card: React.FC<CardProps> = ({ title, variant = "default", className = "", children, ...rest }) => (
  <div className={`pxy-card pxy-${variant} ${className}`} {...rest}>
    <h3 className="pxy-card-title">{title}</h3>
    <div className="pxy-card-body">{children}</div>
  </div>
);

const PerplexityCardPage: React.FC = () => {
  const cards = [
    {
      title: "Default Card",
      body: "A clean surface with subtle shadow and generous padding that keeps focus on the content.",
      variant: "default" as Variant,
    },
    {
      title: "Highlight Card",
      body: "Uses the brand teal background for emphasis — great for call-outs.",
      variant: "highlight" as Variant,
    },
    {
      title: "Info Card",
      body: "Soft sky-blue tint conveys supplemental information without demanding too much attention.",
      variant: "info" as Variant,
    },
  ];

  return (
    <div className="pxy-wrapper">
      <h1 className="pxy-heading">Perplexity Card Showcase</h1>

      <div className="pxy-card-grid">
        {cards.map(({ title, body, variant }) => (
          <Card key={title} title={title} variant={variant}>
            {body}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PerplexityCardPage;
