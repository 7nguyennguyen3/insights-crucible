"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  X,
  Youtube,
  FileAudio,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchCriteria {
  titleSearch: string;
  sourceType: string;
  youtubeUrl: string;
  channelName: string;
  videoName: string;
}

interface EnhancedSearchProps {
  searchCriteria: SearchCriteria;
  onSearchChange: (criteria: SearchCriteria) => void;
  onClearSearch: () => void;
  hasActiveFilters: boolean;
}

export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  searchCriteria,
  onSearchChange,
  onClearSearch,
  hasActiveFilters,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleFieldChange = (field: keyof SearchCriteria, value: string) => {
    onSearchChange({
      ...searchCriteria,
      [field]: value,
    });
  };

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case "youtube":
        return <Youtube className="h-4 w-4 text-red-500" />;
      case "upload":
        return <FileAudio className="h-4 w-4 text-blue-500" />;
      case "paste":
        return <FileText className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Primary Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by title..."
            value={searchCriteria.titleSearch}
            onChange={(e) => handleFieldChange("titleSearch", e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={searchCriteria.sourceType}
          onValueChange={(value) => handleFieldChange("sourceType", value)}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <div className="flex items-center gap-2">
              {getSourceTypeIcon(searchCriteria.sourceType)}
              <SelectValue placeholder="All Sources" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="youtube">
              <div className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-500" />
                YouTube Videos
              </div>
            </SelectItem>
            <SelectItem value="upload">
              <div className="flex items-center gap-2">
                <FileAudio className="h-4 w-4 text-blue-500" />
                Audio Files
              </div>
            </SelectItem>
            <SelectItem value="paste">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                Pasted Text
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearSearch}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Search */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="p-0 h-auto font-normal text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            {isAdvancedOpen ? (
              <ChevronDown className="mr-2 h-4 w-4" />
            ) : (
              <ChevronRight className="mr-2 h-4 w-4" />
            )}
            Advanced Search
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                YouTube URL
              </label>
              <Input
                placeholder="Search by YouTube URL..."
                value={searchCriteria.youtubeUrl}
                onChange={(e) => handleFieldChange("youtubeUrl", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Channel Name
              </label>
              <Input
                placeholder="Search by channel name..."
                value={searchCriteria.channelName}
                onChange={(e) => handleFieldChange("channelName", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Video Name
              </label>
              <Input
                placeholder="Search by video name..."
                value={searchCriteria.videoName}
                onChange={(e) => handleFieldChange("videoName", e.target.value)}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};