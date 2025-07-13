import type { Meta, StoryObj } from '@storybook/nextjs';
import { WhiteCard, WhiteCardProps } from './pwhitecard';
import { Sparkles } from 'lucide-react';

const meta: Meta<typeof WhiteCard> = {
  title: 'Components/WhiteCard',
  component: WhiteCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    summary: { control: 'text' },
    sources: { control: 'object' },
    timeAgo: { control: 'text' },
    icon: { control: false },
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultSources = [
  {
    faviconUrl:
      'https://www.google.com/s2/favicons?sz=128&domain=https://www.forbes.com',
    alt: 'Forbes',
  },
  {
    faviconUrl:
      'https://www.google.com/s2/favicons?sz=128&domain=https://www.ainvest.com',
    alt: 'AInvest',
  },
  {
    faviconUrl:
      'https://www.google.com/s2/favicons?sz=128&domain=https://economictimes.indiatimes.com',
    alt: 'Economic Times',
  },
  {
    faviconUrl:
      'https://www.google.com/s2/favicons?sz=128&domain=https://finance.yahoo.com',
    alt: 'Yahoo Finance',
  },
];

export const Default: Story = {
  args: {
    title: 'Bitcoin Climbs to Record Highs as Institutional Demand Drives Market',
    summary:
      'Bitcoin soared past $118,000, setting new all-time highs amid robust inflows from institutional investors and corporate treasuries. While retail participation lags, spot Bitcoin ETFs saw over $2 billion in net inflows this week, and major firms continue adding to their holdings, signaling confidence in long-term prospects.',
    sources: defaultSources,
    timeAgo: '4 hours ago',
    icon: <Sparkles size={14} />, // Example icon
  },
};

export const NoIcon: Story = {
  args: {
    ...Default.args,
    icon: undefined,
  },
};

export const CustomContent: Story = {
  args: {
    title: 'Ethereum Surges as DeFi Activity Grows',
    summary:
      'Ethereum price jumps 10% as decentralized finance protocols see record user growth and TVL. Analysts predict continued momentum if network upgrades proceed as planned.',
    sources: [
      {
        faviconUrl:
          'https://www.google.com/s2/favicons?sz=128&domain=https://coindesk.com',
        alt: 'Coindesk',
      },
      {
        faviconUrl:
          'https://www.google.com/s2/favicons?sz=128&domain=https://decrypt.co',
        alt: 'Decrypt',
      },
    ],
    timeAgo: '2 hours ago',
    icon: <Sparkles size={14} className="text-purple-600" />,
  },
};

export const EmptySources: Story = {
  args: {
    ...Default.args,
    sources: [],
  },
}; 