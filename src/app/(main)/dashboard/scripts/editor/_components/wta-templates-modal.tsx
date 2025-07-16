"use client";

import { useState } from "react";
import { Search, Copy, Check, ArrowLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import {
  wtaTemplatesData,
  searchTemplates,
  getAllTemplatesFromCategory,
  type WTATemplate,
  type WTACategory,
  type WTASubcategory,
} from "./wta-templates-data";

interface WTATemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (template: WTATemplate) => void;
}

export function WTATemplatesModal({ open, onOpenChange, onTemplateSelect }: WTATemplatesModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<WTACategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<WTASubcategory | null>(null);
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  const searchResults = searchQuery.trim() ? searchTemplates(searchQuery) : [];
  const showSearch = searchQuery.trim().length > 0;

  const handleTemplateClick = async (template: WTATemplate) => {
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(template.text);
      setCopiedTemplateId(template.id);
      setTimeout(() => setCopiedTemplateId(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }

    // Call the selection handler
    onTemplateSelect(template);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const handleBackToCategory = () => {
    setSelectedSubcategory(null);
  };

  const renderTemplateCard = (template: WTATemplate) => (
    <Card
      key={template.id}
      className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
      onClick={() => handleTemplateClick(template)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="flex-1 text-sm leading-relaxed">{template.text}</p>
          <div className="flex-shrink-0">
            {copiedTemplateId === template.id ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="text-muted-foreground h-4 w-4" />
            )}
          </div>
        </div>
        {template.subcategory && (
          <Badge variant="outline" className="mt-2 text-xs">
            {template.subcategory}
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  const renderCategoryGrid = () => (
    <div className="grid gap-4 md:grid-cols-2">
      {wtaTemplatesData.map((category) => {
        const totalTemplates = getAllTemplatesFromCategory(category).length;
        return (
          <Card
            key={category.id}
            className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
            onClick={() => setSelectedCategory(category)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <ChevronRight className="text-muted-foreground h-5 w-5" />
              </div>
              <p className="text-muted-foreground text-sm">{category.description}</p>
              <Badge variant="secondary" className="w-fit">
                {totalTemplates} templates
              </Badge>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );

  const renderCategoryContent = () => {
    if (!selectedCategory) return null;

    // If category has subcategories, show them
    if (selectedCategory.subcategories && selectedCategory.subcategories.length > 0) {
      return (
        <div className="space-y-4">
          {/* Direct templates from category */}
          {selectedCategory.templates.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">General Templates</h3>
              <div className="grid gap-3">{selectedCategory.templates.map(renderTemplateCard)}</div>
            </div>
          )}

          {/* Subcategories */}
          <div className="space-y-4">
            <h3 className="font-medium">Browse by Type</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {selectedCategory.subcategories.map((subcategory) => (
                <Card
                  key={subcategory.id}
                  className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
                  onClick={() => setSelectedSubcategory(subcategory)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{subcategory.name}</CardTitle>
                      <ChevronRight className="text-muted-foreground h-4 w-4" />
                    </div>
                    <p className="text-muted-foreground text-xs">{subcategory.description}</p>
                    <Badge variant="secondary" className="w-fit text-xs">
                      {subcategory.templates.length} templates
                    </Badge>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Category has no subcategories, show templates directly
    return <div className="grid gap-3">{selectedCategory.templates.map(renderTemplateCard)}</div>;
  };

  const renderSubcategoryContent = () => {
    if (!selectedSubcategory) return null;

    return <div className="grid gap-3">{selectedSubcategory.templates.map(renderTemplateCard)}</div>;
  };

  const renderSearchResults = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">
          Found {searchResults.length} template{searchResults.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid gap-3">{searchResults.map(renderTemplateCard)}</div>
    </div>
  );

  const getHeaderTitle = () => {
    if (showSearch) return "Search Results";
    if (selectedSubcategory) return selectedSubcategory.name;
    if (selectedCategory) return selectedCategory.name;
    return "WTA Templates";
  };

  const getHeaderDescription = () => {
    if (showSearch) return `Searching for "${searchQuery}"`;
    if (selectedSubcategory) return selectedSubcategory.description;
    if (selectedCategory) return selectedCategory.description;
    return "Choose from ready-made call-to-action templates";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-4xl flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {(selectedCategory || selectedSubcategory) && !showSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={selectedSubcategory ? handleBackToCategory : handleBackToCategories}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1">
              <DialogTitle className="text-left">{getHeaderTitle()}</DialogTitle>
              <p className="text-muted-foreground mt-1 text-sm">{getHeaderDescription()}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Separator />

        {/* Content */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {showSearch && renderSearchResults()}
            {!showSearch && selectedSubcategory && renderSubcategoryContent()}
            {!showSearch && selectedCategory && !selectedSubcategory && renderCategoryContent()}
            {!showSearch && !selectedCategory && renderCategoryGrid()}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-muted-foreground text-xs">Click any template to copy and use it</p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
