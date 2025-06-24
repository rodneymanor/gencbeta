"use client";

import { useState } from "react";

import LinkNext from "next/link";

import {
  ArrowLeft,
  Plus,
  Link,
  Upload,
  Lightbulb,
  MoreVertical,
  GripVertical,
  Trash2,
  Share2,
  Users,
  Copy,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockCollection = {
  id: 1,
  title: "Viral Hooks & Intros",
  itemCount: 42,
  category: "Writing",
  author: { name: "Arham Khan", avatar: "/avatars/arhamkhnz.png" },
  collaborators: [
    { name: "Jane Doe", avatar: "https://i.pravatar.cc/150?u=jane" },
    { name: "John Smith", avatar: "https://i.pravatar.cc/150?u=john" },
  ],
};

const mockItems = [
  {
    id: 1,
    type: "text",
    content: "The first 3 seconds of your video are more important than the next 3 minutes.",
    source: "Idea",
  },
  {
    id: 2,
    type: "image",
    content: "https://images.unsplash.com/photo-1516131206008-dd041a372dd4?w=400",
    source: "Unsplash",
  },
  { id: 3, type: "link", content: "https://www.verygoodhooks.com", source: "verygoodhooks.com" },
  { id: 4, type: "text", content: "Start with a controversial statement to grab attention.", source: "Idea" },
  { id: 5, type: "text", content: "'You're making your videos wrong' - a great opening line.", source: "Note" },
  {
    id: 6,
    type: "image",
    content: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400",
    source: "Unsplash",
  },
];

interface PageProps {
  params: { collectionId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function CollectionDetailPage({ params }: PageProps) {
  const [items, setItems] = useState(mockItems);

  const renderItemContent = (item: (typeof mockItems)[0]) => {
    switch (item.type) {
      case "image":
        return <img src={item.content} alt="collection item" className="h-full w-full object-cover" />;
      case "link":
        return (
          <div className="p-4">
            <Link className="text-muted-foreground h-6 w-6" />
            <p className="mt-2 truncate font-medium">{item.content.replace(/^https?:\/\//, "")}</p>
          </div>
        );
      case "text":
      default:
        return (
          <div className="p-4">
            <Lightbulb className="text-muted-foreground h-6 w-6" />
            <p className="mt-2 font-medium">{item.content}</p>
          </div>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <LinkNext
            href="/dashboard/collections"
            className="text-muted-foreground flex items-center gap-2 text-sm hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to collections
          </LinkNext>
          <h1 className="text-3xl font-bold">{mockCollection.title}</h1>
          <div className="text-muted-foreground flex items-center gap-4 text-sm">
            <span>{mockCollection.itemCount} items</span>
            <div className="flex items-center">
              <span className="mr-2">by</span>
              <Avatar className="h-5 w-5">
                <AvatarImage src={mockCollection.author.avatar} />
                <AvatarFallback>{mockCollection.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="ml-1.5">{mockCollection.author.name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {mockCollection.collaborators.map((c) => (
              <Avatar key={c.name} className="border-background h-8 w-8 border-2">
                <AvatarImage src={c.avatar} />
                <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <Button variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="gap-2">
                <Lightbulb className="h-4 w-4" /> Add Idea
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Link className="h-4 w-4" /> Add URL
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Upload className="h-4 w-4" /> Upload File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group bg-card relative aspect-square overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-lg"
          >
            {renderItemContent(item)}
            <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="absolute right-0 bottom-0 left-0 p-2 text-white">
              <Badge variant="secondary" className="text-xs">
                {item.source}
              </Badge>
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="secondary" size="icon" className="h-7 w-7">
                <GripVertical className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem className="gap-2">
                    <Copy className="h-4 w-4" /> Copy
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive gap-2">
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
