import type { Meta, StoryObj } from "@storybook/nextjs";

import { DetailCard, DetailCardProps } from "./detailcards";

const meta: Meta<typeof DetailCard> = {
  title: "Components/DetailCard",
  component: DetailCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    faviconUrl: { control: "text" },
    domain: { control: "text" },
    title: { control: "text" },
    className: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    faviconUrl: "https://www.google.com/s2/favicons?sz=128&domain=reddit.com",
    domain: "reddit.com",
    title: "Scrolling Modals? : r/UXDesign - Reddit",
  },
};

export const LongTitle: Story = {
  args: {
    faviconUrl: "https://www.google.com/s2/favicons?sz=128&domain=stackoverflow.com",
    domain: "stackoverflow.com",
    title:
      "How to implement infinite scrolling with React hooks and TypeScript for better performance and user experience?",
  },
};

export const ShortTitle: Story = {
  args: {
    faviconUrl: "https://www.google.com/s2/favicons?sz=128&domain=github.com",
    domain: "github.com",
    title: "React Component",
  },
};

export const LongDomain: Story = {
  args: {
    faviconUrl: "https://www.google.com/s2/favicons?sz=128&domain=very-long-domain-name-example.com",
    domain: "very-long-domain-name-example.com",
    title: "Example article with a very long domain name that should be truncated",
  },
};

export const CustomStyling: Story = {
  args: {
    faviconUrl: "https://www.google.com/s2/favicons?sz=128&domain=twitter.com",
    domain: "twitter.com",
    title: "Custom styled detail card with hover effects",
    className: "hover:shadow-lg hover:scale-105 transition-all duration-300",
  },
};

export const DifferentPlatforms: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <DetailCard
        faviconUrl="https://www.google.com/s2/favicons?sz=128&domain=youtube.com"
        domain="youtube.com"
        title="How to Build a React App from Scratch - Complete Tutorial"
      />
      <DetailCard
        faviconUrl="https://www.google.com/s2/favicons?sz=128&domain=medium.com"
        domain="medium.com"
        title="The Ultimate Guide to TypeScript Best Practices in 2024"
      />
      <DetailCard
        faviconUrl="https://www.google.com/s2/favicons?sz=128&domain=dev.to"
        domain="dev.to"
        title="10 React Performance Tips Every Developer Should Know"
      />
    </div>
  ),
};

export const MultipleCards: Story = {
  render: () => (
    <div className="grid max-w-md grid-cols-2 gap-4">
      <DetailCard
        faviconUrl="https://www.google.com/s2/favicons?sz=128&domain=reddit.com"
        domain="reddit.com"
        title="Scrolling Modals? : r/UXDesign"
      />
      <DetailCard
        faviconUrl="https://www.google.com/s2/favicons?sz=128&domain=stackoverflow.com"
        domain="stackoverflow.com"
        title="React infinite scroll implementation"
      />
      <DetailCard
        faviconUrl="https://www.google.com/s2/favicons?sz=128&domain=github.com"
        domain="github.com"
        title="react-infinite-scroll-component"
      />
      <DetailCard
        faviconUrl="https://www.google.com/s2/favicons?sz=128&domain=twitter.com"
        domain="twitter.com"
        title="New React patterns for 2024"
      />
    </div>
  ),
};
