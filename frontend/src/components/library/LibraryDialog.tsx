// components/library/LibraryDialog.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Loader2 } from "lucide-react";
import { useLibraryActions } from "@/hooks/useLibrary";
import { LibraryMeta } from "@/types/library";

interface LibraryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  currentLibraryMeta?: LibraryMeta;
  onSuccess?: () => void;
}

const COMMON_CATEGORIES = [
  "Business",
  "Technology",
  "Education",
  "Health & Wellness",
  "Science",
  "Politics",
  "Entertainment",
  "Sports",
  "News & Current Events",
  "Personal Development",
  "Finance",
  "History",
  "Philosophy",
  "Art & Culture"
];

const SUGGESTED_TAGS = [
  "leadership", "strategy", "innovation", "productivity", "marketing",
  "entrepreneurship", "AI", "programming", "data science", "design",
  "psychology", "motivation", "career", "investing", "economics",
  "research", "interview", "case study", "tutorial", "analysis"
];

export const LibraryDialog: React.FC<LibraryDialogProps> = ({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  currentLibraryMeta,
  onSuccess
}) => {
  const { addToLibrary, updateLibraryMetadata, isLoading } = useLibraryActions();
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [newTag, setNewTag] = useState("");

  const isEditMode = !!currentLibraryMeta?.libraryEnabled;

  useEffect(() => {
    if (isOpen) {
      if (currentLibraryMeta) {
        setDescription(currentLibraryMeta.libraryDescription || "");
        setTags(currentLibraryMeta.libraryTags || []);
        setCategory(currentLibraryMeta.libraryCategory || "");
      } else {
        // Reset form for new entries
        setDescription("");
        setTags([]);
        setCategory("");
      }
      setNewTag("");
    }
  }, [isOpen, currentLibraryMeta]);

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      return;
    }

    try {
      const metadata = {
        description: description.trim(),
        tags,
        category: category && category !== "none" ? category : undefined
      };

      if (isEditMode) {
        await updateLibraryMetadata(jobId, metadata);
      } else {
        await addToLibrary(jobId, metadata);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Update Library Entry" : "Add to Library"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Analysis Title */}
          <div>
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Analysis Title
            </Label>
            <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm">
              {jobTitle}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Public Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what this analysis covers and what insights readers can expect to gain..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1"
              maxLength={500}
            />
            <div className="text-xs text-slate-500 mt-1">
              {description.length}/500 characters
            </div>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category" className="text-sm font-medium">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Category</SelectItem>
                {COMMON_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-sm font-medium">Tags</Label>

            {/* Current Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {tags.map(tag => (
                  <Badge key={tag} variant="default" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-500"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {/* Add New Tag */}
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} size="sm" disabled={!newTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Suggested Tags */}
            <div>
              <div className="text-xs text-slate-500 mb-2">Suggested tags:</div>
              <div className="flex flex-wrap gap-1">
                {SUGGESTED_TAGS
                  .filter(tag => !tags.includes(tag))
                  .slice(0, 10)
                  .map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 text-xs"
                    onClick={() => handleSuggestedTag(tag)}
                  >
                    + {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> Adding your analysis to the library will make it discoverable by other users.
              Your public share link will remain unchanged, and you can remove it from the library at any time.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!description.trim() || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditMode ? "Update Entry" : "Add to Library"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};