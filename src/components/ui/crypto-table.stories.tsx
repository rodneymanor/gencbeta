import type { Meta, StoryObj } from '@storybook/react';
import { CryptoTable } from './crypto-table';
import type { CryptoData } from './crypto-table';

// Custom data for different story variations
const mockCryptoData: CryptoData[] = [
  {
    id: "BTCUSD",
    name: "Bitcoin",
    symbol: "BTCUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--oox_GDP2--/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/BTCUSD.png",
    volume24h: "$2.1B",
    volumeChange24h: "15.2%",
    price: "$65,432",
    priceChange24h: "2.1%",
    fundingRate: "0.05%",
    href: "https://www.perplexity.ai/finance/BTCUSD",
  },
  {
    id: "ETHUSD",
    name: "Ethereum",
    symbol: "ETHUSD", 
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--neZVdw6j--/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/ETHUSD.png",
    volume24h: "$1.8B",
    volumeChange24h: "-5.7%",
    price: "$3,245",
    priceChange24h: "-1.2%",
    fundingRate: "0.02%",
    href: "https://www.perplexity.ai/finance/ETHUSD",
  },
  {
    id: "SOLUSD",
    name: "Solana",
    symbol: "SOLUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--LnSTbqn---/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/SOLUSD.png",
    volume24h: "$945M",
    volumeChange24h: "22.8%",
    price: "$178.50",
    priceChange24h: "5.4%",
    fundingRate: "0.12%",
    href: "https://www.perplexity.ai/finance/SOLUSD",
  },
];

const bearMarketData: CryptoData[] = [
  {
    id: "BTCUSD",
    name: "Bitcoin",
    symbol: "BTCUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--oox_GDP2--/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/BTCUSD.png",
    volume24h: "$1.2B",
    volumeChange24h: "-45.2%",
    price: "$42,150",
    priceChange24h: "-8.7%",
    fundingRate: "-0.15%",
    href: "https://www.perplexity.ai/finance/BTCUSD",
  },
  {
    id: "ETHUSD",
    name: "Ethereum",
    symbol: "ETHUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--neZVdw6j--/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/ETHUSD.png",
    volume24h: "$890M",
    volumeChange24h: "-52.1%",
    price: "$2,145",
    priceChange24h: "-12.3%",
    fundingRate: "-0.08%",
    href: "https://www.perplexity.ai/finance/ETHUSD",
  },
];

const bullMarketData: CryptoData[] = [
  {
    id: "BTCUSD",
    name: "Bitcoin",
    symbol: "BTCUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--oox_GDP2--/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/BTCUSD.png",
    volume24h: "$5.7B",
    volumeChange24h: "85.6%",
    price: "$125,890",
    priceChange24h: "15.2%",
    fundingRate: "0.25%",
    href: "https://www.perplexity.ai/finance/BTCUSD",
  },
  {
    id: "ETHUSD", 
    name: "Ethereum",
    symbol: "ETHUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--neZVdw6j--/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/ETHUSD.png",
    volume24h: "$4.2B",
    volumeChange24h: "92.3%",
    price: "$8,750",
    priceChange24h: "18.7%",
    fundingRate: "0.18%",
    href: "https://www.perplexity.ai/finance/ETHUSD",
  },
];

const meta: Meta<typeof CryptoTable> = {
  title: 'UI/CryptoTable',
  component: CryptoTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A cryptocurrency trading table component that displays market data including prices, volumes, and funding rates with interactive sorting and row selection.',
      },
    },
  },
  argTypes: {
    data: {
      description: 'Array of cryptocurrency data to display',
      control: { type: 'object' },
    },
    onRowClick: {
      description: 'Callback function when a row is clicked',
      control: { type: 'function' },
    },
    className: {
      description: 'Additional CSS classes to apply to the table container',
      control: { type: 'text' },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with the original data
export const Default: Story = {
  args: {
    onRowClick: (crypto) => console.log('Crypto selected:', crypto),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default cryptocurrency table with the original dataset showing various cryptocurrencies and their market data.',
      },
    },
  },
};

// Story with custom smaller dataset
export const WithCustomData: Story = {
  args: {
    data: mockCryptoData,
    onRowClick: (crypto) => console.log('Crypto selected:', crypto),
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with a smaller custom dataset showing major cryptocurrencies.',
      },
    },
  },
};

// Story showing bear market conditions
export const BearMarket: Story = {
  args: {
    data: bearMarketData,
    onRowClick: (crypto) => console.log('Crypto selected:', crypto),
  },
  parameters: {
    docs: {
      description: {
        story: 'Table showing bear market conditions with negative price changes and reduced volumes.',
      },
    },
  },
};

// Story showing bull market conditions  
export const BullMarket: Story = {
  args: {
    data: bullMarketData,
    onRowClick: (crypto) => console.log('Crypto selected:', crypto),
  },
  parameters: {
    docs: {
      description: {
        story: 'Table showing bull market conditions with positive price changes and high volumes.',
      },
    },
  },
};

// Story without click handler
export const WithoutClickHandler: Story = {
  args: {
    data: mockCryptoData,
  },
  parameters: {
    docs: {
      description: {
        story: 'Table without a custom click handler - clicking rows will open external links in new tabs.',
      },
    },
  },
};

// Story with custom styling
export const WithCustomStyling: Story = {
  args: {
    data: mockCryptoData,
    onRowClick: (crypto) => console.log('Crypto selected:', crypto),
    className: 'shadow-2xl border-2 border-blue-200',
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with custom styling applied via the className prop.',
      },
    },
  },
};

// Story with empty data
export const EmptyState: Story = {
  args: {
    data: [],
    onRowClick: (crypto) => console.log('Crypto selected:', crypto),
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with no data to show the empty state.',
      },
    },
  },
};

// Story with single item
export const SingleItem: Story = {
  args: {
    data: [mockCryptoData[0]],
    onRowClick: (crypto) => console.log('Crypto selected:', crypto),
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with a single cryptocurrency entry.',
      },
    },
  },
};