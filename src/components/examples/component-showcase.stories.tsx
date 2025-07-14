import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ActionCard } from "@/components/common/ActionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const meta: Meta = {
  title: "Examples/ComponentShowcase",
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DashboardCard: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Video Analytics</CardTitle>
              <CardDescription>Performance metrics for your latest video</CardDescription>
            </div>
            <Badge variant="secondary">Live</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Views</p>
              <p className="text-2xl font-bold">125K</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Engagement</p>
              <p className="text-2xl font-bold">8.5%</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1">View Details</Button>
            <Button variant="outline">Export</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create New Script</CardTitle>
          <CardDescription>Fill in the details to create a new script</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Script Title
            </label>
            <Input id="title" placeholder="Enter script title..." />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Input id="description" placeholder="Enter description..." />
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">#viral</Badge>
            <Badge variant="outline">#trending</Badge>
            <Badge variant="outline">+ Add Tag</Badge>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1">Create Script</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

export const ActionCardExample: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <ActionCard
        title="Video Processing"
        description="Your video is being processed and analyzed"
        icon={<div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        actions={[
          {
            id: "cancel",
            label: "Cancel",
            variant: "outline",
            onClick: () => console.log("Cancel clicked"),
          },
          {
            id: "retry",
            label: "Retry",
            onClick: () => console.log("Retry clicked"),
          },
        ]}
      />
    </div>
  ),
};

export const ResponsiveLayout: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Card 1</CardTitle>
          <CardDescription>This card adapts to different screen sizes</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content for card 1</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Card 2</CardTitle>
          <CardDescription>Responsive grid layout</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content for card 2</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Card 3</CardTitle>
          <CardDescription>Three columns on large screens</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content for card 3</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: "desktop",
    },
  },
};
