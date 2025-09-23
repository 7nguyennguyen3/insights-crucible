"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import apiClient from "@/lib/apiClient";
import { LibraryFilters, LibraryResponse } from "@/types/library";
import { spacingVariants, containerVariants } from "@/styles/variants";
import {
  Eye,
  FileText,
  Filter,
  Loader2,
  Play,
  Search,
  Upload,
  User,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

const LibraryPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<LibraryFilters>({
    search: searchParams.get("search") || "",
    tags: searchParams.get("tags")?.split(",").filter(Boolean) || [],
    category: searchParams.get("category") || "",
    sourceType: (searchParams.get("sourceType") as any) || "",
    sortBy: (searchParams.get("sortBy") as any) || "newest",
    page: parseInt(searchParams.get("page") || "1"),
    limit: 12,
  });

  const [searchInput, setSearchInput] = useState(filters.search);

  // Build query string for API
  const buildQueryString = (currentFilters: LibraryFilters) => {
    const params = new URLSearchParams();

    if (currentFilters.search) params.set("search", currentFilters.search);
    if (currentFilters.tags && currentFilters.tags.length > 0)
      params.set("tags", currentFilters.tags.join(","));
    if (currentFilters.category)
      params.set("category", currentFilters.category);
    if (currentFilters.sourceType)
      params.set("sourceType", currentFilters.sourceType);
    if (currentFilters.sortBy) params.set("sortBy", currentFilters.sortBy);
    if (currentFilters.page) params.set("page", currentFilters.page.toString());
    if (currentFilters.limit)
      params.set("limit", currentFilters.limit.toString());

    return params.toString();
  };

  // Fetch library data
  const queryString = buildQueryString(filters);
  const { data, error, isLoading, mutate } = useSWR<LibraryResponse>(
    `/library?${queryString}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.tags && filters.tags.length > 0)
      params.set("tags", filters.tags.join(","));
    if (filters.category) params.set("category", filters.category);
    if (filters.sourceType) params.set("sourceType", filters.sourceType);
    if (filters.sortBy && filters.sortBy !== "newest")
      params.set("sortBy", filters.sortBy);
    if (filters.page && filters.page > 1)
      params.set("page", filters.page.toString());

    const newUrl = params.toString()
      ? `/library?${params.toString()}`
      : "/library";
    router.replace(newUrl, { scroll: false });
  }, [filters, router]);

  const handleFilterChange = (newFilters: Partial<LibraryFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    handleFilterChange({ tags: newTags });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  // Parse ISO 8601 duration format (e.g., "PT10M" -> "10 min")
  const parseYoutubeDuration = (isoDuration?: string) => {
    if (!isoDuration) return null;

    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = isoDuration.match(regex);

    if (!matches) return null;

    const hours = parseInt(matches[1] || "0");
    const minutes = parseInt(matches[2] || "0");
    const seconds = parseInt(matches[3] || "0");

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes} min`;
    } else {
      return `${seconds}s`;
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "youtube":
        return <Play className="h-4 w-4" />;
      case "upload":
        return <Upload className="h-4 w-4" />;
      case "paste":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleViewAnalysis = async (publicShareId: string) => {
    // Track the view
    try {
      await apiClient.post(`/library/view/${publicShareId}`);
      mutate(); // Refresh to update view count
    } catch (error) {
      console.warn("Could not track view:", error);
    }

    // Navigate to public share page
    router.push(`/share/${publicShareId}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center text-red-500">
            <p>Failed to load library. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div
        className={`${spacingVariants.heroPadding} ${containerVariants.section}`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Analysis Library
            </h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
              Discover and explore public content analyses shared by the
              community
            </p>
          </header>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search analyses, descriptions, or tags..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} variant="default">
                Search
              </Button>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Filters:
                </span>
              </div>

              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  handleFilterChange({ sortBy: value as any })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="mostViewed">Most Viewed</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.sourceType || "all"}
                onValueChange={(value) =>
                  handleFilterChange({
                    sourceType: value === "all" ? undefined : (value as any),
                  })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Source Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="upload">Audio Upload</SelectItem>
                  <SelectItem value="paste">Text Paste</SelectItem>
                </SelectContent>
              </Select>

              {data?.availableCategories &&
                data.availableCategories.length > 0 && (
                  <Select
                    value={filters.category || "all"}
                    onValueChange={(value) =>
                      handleFilterChange({
                        category: value === "all" ? undefined : value,
                      })
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {data.availableCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

              {/* Clear Filters */}
              {(filters.search ||
                filters.tags?.length ||
                filters.category ||
                filters.sourceType) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters({ sortBy: "newest", page: 1, limit: 12 });
                    setSearchInput("");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Available Tags */}
            {data?.availableTags && data.availableTags.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Popular Tags:
                </span>
                <div className="flex flex-wrap gap-2">
                  {data.availableTags.slice(0, 20).map((tag) => (
                    <Badge
                      key={tag}
                      variant={
                        filters.tags?.includes(tag) ? "default" : "secondary"
                      }
                      className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <p className="text-slate-600 dark:text-slate-300">
                  {data?.total
                    ? `${data.total} analyses found`
                    : "No analyses found"}
                </p>
                {data && data.totalPages > 1 && (
                  <p className="text-sm text-slate-500">
                    Page {data.page} of {data.totalPages}
                  </p>
                )}
              </div>

              {/* Analysis Grid */}
              {data?.entries && data.entries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {data.entries.map((entry) => (
                    <Card
                      key={entry.id}
                      className="pt-0 hover:shadow-lg transition-shadow cursor-pointer overflow-hidden flex flex-col border-slate-200 dark:border-slate-800 dark:bg-slate-900/50"
                      onClick={() => handleViewAnalysis(entry.publicShareId)}
                    >
                      {/* Thumbnail Section */}
                      <CardHeader className="relative p-0 m-0">
                        <div className="aspect-video w-full overflow-hidden relative">
                          {entry.sourceType === "youtube" &&
                          entry.thumbnailUrl ? (
                            <>
                              <img
                                src={entry.thumbnailUrl}
                                alt={entry.youtubeVideoTitle || entry.title}
                                className="object-cover w-full h-full bg-slate-200 dark:bg-slate-700"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                              {/* Channel name - bottom left */}
                              {entry.youtubeChannelName && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md max-w-[30%] truncate cursor-help">
                                        {entry.youtubeChannelName}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="max-w-xs"
                                    >
                                      <p className="text-sm">
                                        {entry.youtubeChannelName}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {/* View count - top right */}
                              <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{entry.viewCount}</span>
                              </div>

                              {/* Original video title - bottom right */}
                              {entry.youtubeVideoTitle && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md max-w-[40%] truncate cursor-help">
                                        {entry.youtubeVideoTitle}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="max-w-xs"
                                    >
                                      <p className="text-sm">
                                        {entry.youtubeVideoTitle}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </>
                          ) : (
                            /* Non-YouTube thumbnail placeholder */
                            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <div className="text-center text-slate-500 dark:text-slate-400">
                                <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                  {getSourceIcon(entry.sourceType)}
                                </div>
                                <p className="font-medium text-sm capitalize">
                                  {entry.sourceType}
                                </p>
                              </div>
                              {/* View count - top right for non-YouTube */}
                              <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{entry.viewCount}</span>
                              </div>
                              {/* Duration - top right, below view count for non-YouTube */}
                              {entry.duration && (
                                <div className="absolute top-10 right-2 bg-black/80 text-white text-sm px-2 py-1 rounded-md font-mono">
                                  {formatDuration(entry.duration)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      {/* Card Content */}
                      <CardContent className="flex flex-col flex-grow p-4">
                        {/* Main Title - Bold and Prominent */}
                        <h3 className="font-semibold text-lg leading-tight mb-2 text-slate-800 dark:text-slate-100 line-clamp-2">
                          {entry.title}
                        </h3>

                        {/* Description */}
                        {entry.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                            {entry.description}
                          </p>
                        )}

                        {/* Key Insight Preview */}
                        {entry.previewData?.keyInsight && (
                          <div className="text-sm text-slate-600 dark:text-slate-300 italic mb-3 line-clamp-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                            "{entry.previewData.keyInsight}"
                          </div>
                        )}

                        {/* Tags */}
                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {entry.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {entry.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{entry.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Footer with creator and stats */}
                        <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex justify-between items-center text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{entry.creator.displayName}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500 mb-4">
                    No analyses found matching your criteria
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({ sortBy: "newest", page: 1, limit: 12 });
                      setSearchInput("");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    disabled={data.page <= 1}
                    onClick={() => handleFilterChange({ page: data.page - 1 })}
                  >
                    Previous
                  </Button>

                  {/* Page Numbers */}
                  {Array.from(
                    { length: Math.min(5, data.totalPages) },
                    (_, i) => {
                      const page = Math.max(1, data.page - 2) + i;
                      if (page > data.totalPages) return null;

                      return (
                        <Button
                          key={page}
                          variant={page === data.page ? "default" : "outline"}
                          onClick={() => handleFilterChange({ page })}
                        >
                          {page}
                        </Button>
                      );
                    }
                  )}

                  <Button
                    variant="outline"
                    disabled={data.page >= data.totalPages}
                    onClick={() => handleFilterChange({ page: data.page + 1 })}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LibraryPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-slate-900">
          <div
            className={`${spacingVariants.heroPadding} ${containerVariants.section}`}
          >
            <div className="max-w-7xl mx-auto">
              <header className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Analysis Library
                </h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
                  Loading library...
                </p>
              </header>
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LibraryPageContent />
    </Suspense>
  );
};

export default LibraryPage;
