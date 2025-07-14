import React from "react";

interface TabItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  buttonText: string;
  href: string;
}

interface PerplexityTabsProps {
  items: TabItem[];
  className?: string;
}

export function PerplexityTabs({ items, className = "" }: PerplexityTabsProps) {
  return (
    <div
      className={`flex w-full max-w-4xl flex-col gap-4 bg-white font-sans text-base leading-6 text-black ${className}`}
    >
      {items.map((item, index) => (
        <a
          key={item.id}
          href={item.href}
          className={`flex items-center gap-4 border-b border-gray-200 p-4 text-black no-underline transition-colors duration-200 hover:bg-gray-50 ${
            index === items.length - 1 ? "border-b-0" : ""
          }`}
        >
          {/* Icon Container */}
          <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-transparent shadow-sm">
            <span className="text-2xl leading-8">{item.icon}</span>
            <span className="absolute inset-0 block rounded-lg shadow-inner" />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="text-base leading-6 font-medium text-gray-900">{item.title}</div>
            <div className="text-sm leading-5 text-gray-600">{item.description}</div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Button */}
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            <span className="relative leading-7">{item.buttonText}</span>
          </button>
        </a>
      ))}
    </div>
  );
}

// Example usage with sample data
export function PerplexityTabsExample() {
  const sampleItems: TabItem[] = [
    {
      id: "transcripts",
      title: "S&P 500 Transcripts",
      description: "Query any S&P company transcript over the last two years",
      icon: "🎙️",
      buttonText: "Search transcripts",
      href: "https://www.perplexity.ai/collections/s-p-500-transcripts-uAswRB_uSaSI.jrrkf.isQ",
    },
    {
      id: "profile-builder",
      title: "Profile Builder",
      description: "Enter any company name to get a clear, comprehensive profile",
      icon: "🕵️‍♂️",
      buttonText: "Build profiles",
      href: "https://www.perplexity.ai/collections/profile-builder-Twp3RAkHRjyuh1bwPt1lUw",
    },
    {
      id: "stock-screener",
      title: "Stock Screener",
      description: "Ask questions about stocks in the S&P 500, Russell 3000, and India",
      icon: "🪟",
      buttonText: "Screen stocks",
      href: "https://www.perplexity.ai/collections/stock-screener-objyxCXmSMqUDO5d0B5E1A",
    },
  ];

  return <PerplexityTabs items={sampleItems} />;
}
