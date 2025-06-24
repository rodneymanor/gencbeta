"use client";

import { useState } from "react";

import { Plus, Search, LayoutGrid, List, Filter, Share2, User, MoreHorizontal } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data for collections
const mockCollections = [
  {
    id: 1,
    title: "Viral Hooks & Intros",
    itemCount: 42,
    category: "Writing",
    author: "Arham Khan",
    avatar: "/avatars/arhamkhnz.png",
    coverImages: [
      "https://images.unsplash.com/photo-1516131206008-dd041a372dd4?w=400",
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400",
      "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=400",
    ],
  },
  {
    id: 2,
    title: "Aesthetic B-Roll Shots",
    itemCount: 112,
    category: "Visuals",
    author: "Jane Doe",
    avatar: "https://i.pravatar.cc/150?u=jane",
    coverImages: [
      "https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=400",
      "https://images.unsplash.com/photo-1542038784-56eD8DE09313?w=400",
      "https://images.unsplash.com/photo-1607538205438-ac70d5a381e4?w=400",
    ],
  },
  {
    id: 3,
    title: "Sound Design & Music",
    itemCount: 78,
    category: "Audio",
    author: "John Smith",
    avatar: "https://i.pravatar.cc/150?u=john",
    coverImages: [
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
      "https://images.unsplash.com/photo-1471478331744-80352b53dbde?w=400",
    ],
  },
  {
    id: 4,
    title: "Killer CTAs",
    itemCount: 25,
    category: "Writing",
    author: "Arham Khan",
    avatar: "/avatars/arhamkhnz.png",
    coverImages: [
      "https://images.unsplash.com/photo-1587614382346-4ec58e373a97?w=400",
      "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=400",
      "https://images.unsplash.com/photo-1586953208448-b95a8e359439?w=400",
    ],
  },
];

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredCollections = mockCollections.filter((collection) => {
    const matchesSearch = collection.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || collection.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collections</h1>
          <p className="text-muted-foreground">Your curated boards of inspiration and assets</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
              <DialogDescription>Start a new board to organize your ideas and assets.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collection-name">Collection Name</Label>
                <Input id="collection-name" placeholder="e.g., Viral Hooks & Intros" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection-category">Category</Label>
                <Select>
                  <SelectTrigger id="collection-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="writing">Writing</SelectItem>
                    <SelectItem value="visuals">Visuals</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="strategy">Strategy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Collection</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="writing">Writing</SelectItem>
            <SelectItem value="visuals">Visuals</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="strategy">Strategy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCollections.map((collection) => (
          <div
            key={collection.id}
            className="group bg-card relative overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-lg"
          >
            <div className="flex h-40">
              {collection.coverImages.map((src, index) => (
                <div key={index} className="w-1/3 overflow-hidden">
                  <img
                    src={src}
                    alt={`${collection.title} cover ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold">{collection.title}</h3>
                <Badge variant="secondary">{collection.category}</Badge>
              </div>
              <p className="text-muted-foreground text-sm">{collection.itemCount} items</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={collection.avatar} />
                    <AvatarFallback>{collection.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{collection.author}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
