import type { Meta, StoryObj } from "@storybook/nextjs";

import { PerplexityTabs } from "./ptabs";

const meta: Meta<typeof PerplexityTabs> = {
  title: "Components/PerplexityTabs",
  component: PerplexityTabs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    items: {
      control: "object",
      description: "Array of tab items to display",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultItems = [
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

export const Default: Story = {
  args: {
    items: defaultItems,
  },
};

export const SingleItem: Story = {
  args: {
    items: [
      {
        id: "single",
        title: "Single Tab Item",
        description: "This shows how the component looks with just one item",
        icon: "🎯",
        buttonText: "Action",
        href: "https://example.com/single",
      },
    ],
  },
};

export const CustomItems: Story = {
  args: {
    items: [
      {
        id: "custom-1",
        title: "Custom Tab 1",
        description: "This is a custom tab with different content and styling",
        icon: "🚀",
        buttonText: "Launch",
        href: "https://example.com/1",
      },
      {
        id: "custom-2",
        title: "Custom Tab 2",
        description: "Another custom tab for testing different scenarios",
        icon: "⚡",
        buttonText: "Activate",
        href: "https://example.com/2",
      },
      {
        id: "custom-3",
        title: "Custom Tab 3",
        description: "A third custom tab to show variety in content",
        icon: "🌟",
        buttonText: "Explore",
        href: "https://example.com/3",
      },
    ],
  },
};

export const WithCustomStyling: Story = {
  args: {
    items: defaultItems,
    className: "bg-gray-50 p-6 rounded-lg shadow-lg max-w-2xl",
  },
};

export const CompactLayout: Story = {
  args: {
    items: defaultItems,
    className: "max-w-lg",
  },
};

export const EmptyState: Story = {
  args: {
    items: [],
  },
};

export const LongContent: Story = {
  args: {
    items: [
      {
        id: "long-title",
        title: "This is a very long title that might wrap to multiple lines and test the component layout",
        description:
          "This is a very long description that contains a lot of text to test how the component handles overflow and text wrapping in different scenarios. It should gracefully handle this content.",
        icon: "📝",
        buttonText: "Very Long Button Text",
        href: "https://example.com/long",
      },
      {
        id: "short-content",
        title: "Short",
        description: "Minimal content",
        icon: "⚡",
        buttonText: "Go",
        href: "https://example.com/short",
      },
    ],
  },
};

export const DifferentIcons: Story = {
  args: {
    items: [
      {
        id: "emoji-1",
        title: "Emoji Icon",
        description: "Using emoji as icon",
        icon: "🎨",
        buttonText: "Create",
        href: "https://example.com/emoji",
      },
      {
        id: "emoji-2",
        title: "Another Emoji",
        description: "Different emoji icon",
        icon: "🔥",
        buttonText: "Burn",
        href: "https://example.com/fire",
      },
      {
        id: "emoji-3",
        title: "Third Emoji",
        description: "Yet another emoji",
        icon: "💎",
        buttonText: "Diamond",
        href: "https://example.com/diamond",
      },
    ],
  },
};
