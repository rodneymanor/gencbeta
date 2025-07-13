import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Plus, Edit, Download } from 'lucide-react';
import { ActionCard } from './index';

const meta: Meta<typeof ActionCard> = {
  title: 'Common/ActionCard',
  component: ActionCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    showCard: {
      control: { type: 'boolean' },
    },
    compact: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Create New Script',
    description: 'Start writing a new script with AI assistance',
    icon: <Plus className="h-5 w-5" />,
    actions: [
      {
        id: 'create',
        label: 'Create Script',
        onClick: () => console.log('Create script clicked'),
      },
      {
        id: 'template',
        label: 'Use Template',
        variant: 'outline',
        onClick: () => console.log('Use template clicked'),
      },
    ],
  },
};

export const Compact: Story = {
  args: {
    title: 'Quick Actions',
    description: 'Common actions for this item',
    icon: <Edit className="h-5 w-5" />,
    compact: true,
    actions: [
      {
        id: 'edit',
        label: 'Edit',
        size: 'sm',
        onClick: () => console.log('Edit clicked'),
      },
      {
        id: 'delete',
        label: 'Delete',
        variant: 'destructive',
        size: 'sm',
        onClick: () => console.log('Delete clicked'),
      },
    ],
  },
};

export const WithoutCard: Story = {
  args: {
    title: 'Inline Actions',
    description: 'Actions displayed without a card wrapper',
    icon: <Download className="h-5 w-5" />,
    showCard: false,
    actions: [
      {
        id: 'download',
        label: 'Download',
        onClick: () => console.log('Download clicked'),
      },
    ],
  },
};

export const LoadingState: Story = {
  args: {
    title: 'Processing Data',
    description: 'Please wait while we process your request',
    icon: <Plus className="h-5 w-5" />,
    actions: [
      {
        id: 'process',
        label: 'Process',
        loading: true,
        onClick: () => console.log('Process clicked'),
      },
    ],
  },
};

export const MultipleActions: Story = {
  args: {
    title: 'Video Management',
    description: 'Manage your video content and settings',
    icon: <Edit className="h-5 w-5" />,
    actions: [
      {
        id: 'edit',
        label: 'Edit',
        onClick: () => console.log('Edit clicked'),
      },
      {
        id: 'duplicate',
        label: 'Duplicate',
        variant: 'outline',
        onClick: () => console.log('Duplicate clicked'),
      },
      {
        id: 'delete',
        label: 'Delete',
        variant: 'destructive',
        onClick: () => console.log('Delete clicked'),
      },
    ],
  },
}; 