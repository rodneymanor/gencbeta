import type { Meta, StoryObj } from "@storybook/nextjs";

import { PerplexityTable } from "./ptable";

const meta: Meta<typeof PerplexityTable> = {
  title: "Components/PerplexityTable",
  component: PerplexityTable,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    collections: {
      control: "object",
      description: "Array of collection items to display",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const CustomCollections: Story = {
  args: {
    collections: [
      {
        id: "custom-1",
        title: "Custom Collection 1",
        description: "This is a custom collection with different content",
        icon: "🚀",
        buttonText: "Launch",
        href: "https://example.com/1",
      },
      {
        id: "custom-2",
        title: "Custom Collection 2",
        description: "Another custom collection for testing",
        icon: "⚡",
        buttonText: "Activate",
        href: "https://example.com/2",
      },
    ],
  },
};

export const SingleCollection: Story = {
  args: {
    collections: [
      {
        id: "single",
        title: "Single Collection",
        description: "This shows how the component looks with just one item",
        icon: "🎯",
        buttonText: "Target",
        href: "https://example.com/single",
      },
    ],
  },
};

export const WithCustomStyling: Story = {
  args: {
    className: "bg-gray-50 p-6 rounded-lg shadow-lg",
  },
};

export const EmptyState: Story = {
  args: {
    collections: [],
  },
};
