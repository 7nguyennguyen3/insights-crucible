"use client";

import { useState } from "react";
import { useFolders } from "@/hooks/useFolders";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Folder as FolderIcon,
  Star,
  LayoutDashboard,
  Plus,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FolderSidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export default function FolderSidebar({
  activeFilter,
  onFilterChange,
}: FolderSidebarProps) {
  // We get mutate from the hook to allow for automatic refreshing
  const { folders, isLoading, mutate } = useFolders();

  // State to manage the create folder dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    try {
      // Call the API endpoint we created in Phase 3a
      await apiClient.post("/folders/create", { name: newFolderName });
      toast.success(`Folder "${newFolderName}" created.`);

      // This is the key: tell SWR to re-fetch the folder list
      mutate();

      // Close the dialog and reset the form
      setIsDialogOpen(false);
      setNewFolderName("");
    } catch (error) {
      toast.error("Failed to create folder. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-2 mt-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );

  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <h2 className="text-lg font-semibold tracking-tight px-2">Workspace</h2>
      <div className="space-y-1 mt-4">
        <Button
          variant={activeFilter === "all" ? "secondary" : "ghost"}
          onClick={() => onFilterChange("all")}
          className="w-full justify-start"
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          All Analyses
        </Button>
        <Button
          variant={activeFilter === "starred" ? "secondary" : "ghost"}
          onClick={() => onFilterChange("starred")}
          className="w-full justify-start"
        >
          <Star className="mr-2 h-4 w-4" />
          Starred
        </Button>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold tracking-tight px-2 mb-4">
          Folders
        </h2>
        <div className="space-y-1">
          {isLoading
            ? renderSkeleton()
            : folders.map((folder) => (
                <Button
                  key={folder.id}
                  variant={activeFilter === folder.id ? "secondary" : "ghost"}
                  onClick={() => onFilterChange(folder.id)}
                  className="w-full justify-start"
                >
                  <FolderIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">{folder.name}</span>
                </Button>
              ))}
        </div>
      </div>

      {/* This button now opens the dialog */}
      <Button
        variant="outline"
        className="w-full mt-6"
        onClick={() => setIsDialogOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        New Folder
      </Button>

      {/* The Dialog component for creating a new folder */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder to organize your analyses.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Q3 Marketing Projects"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateFolder} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
