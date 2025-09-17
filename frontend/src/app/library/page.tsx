"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR from "swr";
import apiClient from "@/lib/apiClient";
import { LibraryResponse, LibraryFilters } from "@/types/library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Filter, Eye, Clock, User, Play, FileText, Upload, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

const LibraryPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<LibraryFilters>({
    search: searchParams.get("search") || "",
    tags: searchParams.get("tags")?.split(",").filter(Boolean) || [],
    category: searchParams.get("category") || "",
    sourceType: searchParams.get("sourceType") as any || "",
    sortBy: (searchParams.get("sortBy") as any) || "newest",
    page: parseInt(searchParams.get("page") || "1"),
    limit: 12
  });

  const [searchInput, setSearchInput] = useState(filters.search);

  // Build query string for API
  const buildQueryString = (currentFilters: LibraryFilters) => {
    const params = new URLSearchParams();

    if (currentFilters.search) params.set("search", currentFilters.search);
    if (currentFilters.tags && currentFilters.tags.length > 0) params.set("tags", currentFilters.tags.join(","));
    if (currentFilters.category) params.set("category", currentFilters.category);
    if (currentFilters.sourceType) params.set("sourceType", currentFilters.sourceType);
    if (currentFilters.sortBy) params.set("sortBy", currentFilters.sortBy);
    if (currentFilters.page) params.set("page", currentFilters.page.toString());
    if (currentFilters.limit) params.set("limit", currentFilters.limit.toString());

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
    if (filters.tags && filters.tags.length > 0) params.set("tags", filters.tags.join(","));
    if (filters.category) params.set("category", filters.category);
    if (filters.sourceType) params.set("sourceType", filters.sourceType);
    if (filters.sortBy && filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);
    if (filters.page && filters.page > 1) params.set("page", filters.page.toString());

    const newUrl = params.toString() ? `/library?${params.toString()}` : "/library";
    router.replace(newUrl, { scroll: false });
  }, [filters, router]);

  const handleFilterChange = (newFilters: Partial<LibraryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
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

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'youtube':
        return <Play className="h-4 w-4" />;
      case 'upload':
        return <Upload className="h-4 w-4" />;
      case 'paste':
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Analysis Library
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Discover and explore public content analyses shared by the community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search analyses, descriptions, or tags..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters:</span>
            </div>

            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange({ sortBy: value as any })}>
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

            <Select value={filters.sourceType || "all"} onValueChange={(value) => handleFilterChange({ sourceType: value === "all" ? undefined : value as any })}>
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

            {data?.availableCategories && data.availableCategories.length > 0 && (
              <Select value={filters.category || "all"} onValueChange={(value) => handleFilterChange({ category: value === "all" ? undefined : value })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {data.availableCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Clear Filters */}
            {(filters.search || filters.tags?.length || filters.category || filters.sourceType) && (
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
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Popular Tags:</span>
              <div className="flex flex-wrap gap-2">
                {data.availableTags.slice(0, 20).map(tag => (
                  <Badge
                    key={tag}
                    variant={filters.tags?.includes(tag) ? "default" : "secondary"}
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
                {data?.total ? `${data.total} analyses found` : 'No analyses found'}
              </p>
              {data && data.totalPages > 1 && (
                <p className="text-sm text-slate-500">
                  Page {data.page} of {data.totalPages}
                </p>
              )}
            </div>

            {/* Analysis Grid */}
            {data?.entries && data.entries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.entries.map(entry => (
                  <Card key={entry.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewAnalysis(entry.publicShareId)}>
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          {getSourceIcon(entry.sourceType)}
                          <span className="capitalize">{entry.sourceType}</span>
                          {entry.duration && (
                            <>
                              <Clock className="h-3 w-3" />
                              <span>{formatDuration(entry.duration)}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Eye className="h-3 w-3" />
                          <span>{entry.viewCount}</span>
                        </div>
                      </div>

                      <CardTitle className="text-lg leading-tight line-clamp-2">
                        {entry.title}
                      </CardTitle>

                      {entry.description && (
                        <CardDescription className="line-clamp-2">
                          {entry.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Preview Data */}
                      {entry.previewData?.keyInsight && (
                        <div className="text-sm text-slate-600 dark:text-slate-300 italic line-clamp-2">
                          "{entry.previewData.keyInsight}"
                        </div>
                      )}

                      {/* Tags */}
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
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

                      <Separator />

                      {/* Creator and Stats */}
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{entry.creator.displayName}</span>
                        </div>
                        {entry.previewData?.takeawayCount && (
                          <span>{entry.previewData.takeawayCount} takeaways</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500 mb-4">No analyses found matching your criteria</p>
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
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={data.page <= 1}
                  onClick={() => handleFilterChange({ page: data.page - 1 })}
                >
                  Previous
                </Button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
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
                })}

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
  );
};

const LibraryPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto max-w-6xl p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Analysis Library
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Loading library...
            </p>
          </div>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    }>
      <LibraryPageContent />
    </Suspense>
  );
};

export default LibraryPage;