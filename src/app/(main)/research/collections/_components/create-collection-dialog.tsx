"use client";

import { useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, COLLECTION_LIMITS } from "@/lib/collections";

interface CreateCollectionDialogProps {
  onCollectionCreated?: () => void;
  children?: React.ReactNode;
}

// Validation helper functions to reduce complexity
const validateTitle = (title: string) => {
  const length = title.length;
  const isValid = title.trim().length > 0 && length <= COLLECTION_LIMITS.MAX_TITLE_LENGTH;
  const isOverLimit = length > COLLECTION_LIMITS.MAX_TITLE_LENGTH;
  const isEmpty = !title.trim() && length > 0;

  return { length, isValid, isOverLimit, isEmpty };
};

const validateDescription = (description: string) => {
  const length = description.length;
  const isValid = length <= COLLECTION_LIMITS.MAX_DESCRIPTION_LENGTH;
  const isOverLimit = length > COLLECTION_LIMITS.MAX_DESCRIPTION_LENGTH;

  return { length, isValid, isOverLimit };
};

// Form input components to reduce main component complexity
const TitleInput = ({
  title,
  setTitle,
  titleValidation,
  onKeyPress,
}: {
  title: string;
  setTitle: (value: string) => void;
  titleValidation: ReturnType<typeof validateTitle>;
  onKeyPress: (e: React.KeyboardEvent) => void;
}) => (
  <div className="space-y-2">
    <Label htmlFor="collection-title" className="text-sm font-medium">
      Collection Title
    </Label>
    <Input
      id="collection-title"
      placeholder="Enter collection title..."
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onKeyPress={onKeyPress}
      className={`min-h-[44px] ${titleValidation.isOverLimit ? "border-red-500" : ""}`}
      required
    />
    <div className="flex items-center justify-between">
      <div>
        {titleValidation.isEmpty && <p className="text-sm text-red-500">Collection title is required</p>}
        {titleValidation.isOverLimit && <p className="text-sm text-red-500">Title is too long</p>}
      </div>
      <span className={`text-xs ${titleValidation.isOverLimit ? "text-red-500" : "text-muted-foreground"}`}>
        {titleValidation.length}/{COLLECTION_LIMITS.MAX_TITLE_LENGTH}
      </span>
    </div>
  </div>
);

const DescriptionInput = ({
  description,
  setDescription,
  descriptionValidation,
}: {
  description: string;
  setDescription: (value: string) => void;
  descriptionValidation: ReturnType<typeof validateDescription>;
}) => (
  <div className="space-y-2">
    <Label htmlFor="collection-description" className="text-sm font-medium">
      Description (Optional)
    </Label>
    <Textarea
      id="collection-description"
      placeholder="Describe your collection..."
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      className={`min-h-[80px] resize-none ${descriptionValidation.isOverLimit ? "border-red-500" : ""}`}
    />
    <div className="flex items-center justify-between">
      <div>{descriptionValidation.isOverLimit && <p className="text-sm text-red-500">Description is too long</p>}</div>
      <span className={`text-xs ${descriptionValidation.isOverLimit ? "text-red-500" : "text-muted-foreground"}`}>
        {descriptionValidation.length}/{COLLECTION_LIMITS.MAX_DESCRIPTION_LENGTH}
      </span>
    </div>
  </div>
);

export function CreateCollectionDialog({ onCollectionCreated, children }: CreateCollectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();

  // Validation states
  const titleValidation = validateTitle(title);
  const descriptionValidation = validateDescription(description);
  const isFormValid = titleValidation.isValid && descriptionValidation.isValid;

  const handleCreateCollection = async () => {
    if (!isFormValid || !user) return;

    setIsCreating(true);
    try {
      await CollectionsService.createCollection(user.uid, title.trim(), description.trim());

      // Reset form
      setTitle("");
      setDescription("");
      setIsOpen(false);

      // Notify parent component
      onCollectionCreated?.();
    } catch (error) {
      console.error("Error creating collection:", error);
      // TODO: Add toast notification for error
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreateCollection();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setTitle("");
      setDescription("");
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="icon" variant="ghost">
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold">Create New Collection</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a collection to organize your favorite videos and content.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <TitleInput title={title} setTitle={setTitle} titleValidation={titleValidation} onKeyPress={handleKeyPress} />
          <DescriptionInput
            description={description}
            setDescription={setDescription}
            descriptionValidation={descriptionValidation}
          />
          <Button
            onClick={handleCreateCollection}
            disabled={!isFormValid || isCreating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
          >
            {isCreating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isCreating ? "Creating..." : "Create Collection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
