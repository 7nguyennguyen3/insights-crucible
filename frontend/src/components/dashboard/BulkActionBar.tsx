// components/dashboard/BulkActionBar.tsx

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  X,
  Share2,
  Trash2,
  FolderOpen,
  Star,
  CheckSquare,
  Square
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBulkShare: () => void;
  onBulkDelete: () => void;
  onBulkMove: () => void;
  onBulkStar: () => void;
  className?: string;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onBulkShare,
  onBulkDelete,
  onBulkMove,
  onBulkStar,
  className
}) => {
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <Card className={cn(
      "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 shadow-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900",
      className
    )}>
      <div className="flex items-center gap-4 px-6 py-4">
        {/* Selection info */}
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm font-medium">
            {selectedCount} selected
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={isAllSelected ? onClearSelection : onSelectAll}
            className="h-8 px-3 text-xs"
          >
            {isAllSelected ? (
              <>
                <CheckSquare className="h-3 w-3 mr-1" />
                Deselect All
              </>
            ) : (
              <>
                <Square className="h-3 w-3 mr-1" />
                Select All ({totalCount})
              </>
            )}
          </Button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkShare}
            className="h-8 px-3"
          >
            <Share2 className="h-3 w-3 mr-1" />
            Share to Library
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onBulkStar}
            className="h-8 px-3"
          >
            <Star className="h-3 w-3 mr-1" />
            Star
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onBulkMove}
            className="h-8 px-3"
          >
            <FolderOpen className="h-3 w-3 mr-1" />
            Move
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onBulkDelete}
            className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8 w-8 p-0 ml-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear selection</span>
        </Button>
      </div>
    </Card>
  );
};