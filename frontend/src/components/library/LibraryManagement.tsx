// components/library/LibraryManagement.tsx

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Edit3, Trash2, ExternalLink, BookOpen, Loader2, BarChart3, TrendingUp } from "lucide-react";
import { useLibraryManagement, useLibraryActions } from "@/hooks/useLibrary";
import { LibraryDialog } from "./LibraryDialog";
import { toast } from "sonner";

export const LibraryManagement = () => {
  const { contributions, stats, isLoading, error, mutate } = useLibraryManagement();
  const { removeFromLibrary, isLoading: isActionLoading } = useLibraryActions();
  const [editingEntry, setEditingEntry] = useState<{ jobId: string; jobTitle: string; meta: any } | null>(null);

  const handleRemoveFromLibrary = async (jobId: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the library? This cannot be undone.`)) {
      return;
    }

    try {
      await removeFromLibrary(jobId);
      mutate(); // Refresh the data
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleEditSuccess = () => {
    setEditingEntry(null);
    mutate(); // Refresh the data
  };

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            <span>Library Contributions</span>
          </CardTitle>
          <CardDescription>
            Manage your contributions to the public analysis library.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-8">
            <p>Failed to load library data. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            <span>Library Contributions</span>
          </CardTitle>
          <CardDescription>
            Manage your contributions to the public analysis library.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Overview */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <Skeleton className="h-6 w-20 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                  <BookOpen className="h-4 w-4" />
                  <span>Total Entries</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats.totalEntries}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                  <Eye className="h-4 w-4" />
                  <span>Total Views</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats.totalViews}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Avg Views</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats.totalEntries > 0 ? Math.round(stats.totalViews / stats.totalEntries) : 0}
                </div>
              </div>
            </div>
          )}

          {/* Popular Tags */}
          {!isLoading && stats.popularTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Your Most Used Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {stats.popularTags.slice(0, 10).map(({ tag, count }) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag} ({count})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Library Entries Table */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Your Library Entries
              </h4>
              <Button asChild variant="outline" size="sm">
                <Link href="/library">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Browse Library
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : contributions.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <BookOpen className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No library contributions yet</p>
                <p className="text-sm text-slate-500 mb-4">
                  Share your analyses with the community by adding them to the library
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="text-center">Views</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributions.map((entry) => (
                      <TableRow key={entry.jobId}>
                        <TableCell className="font-medium">
                          <div className="max-w-[200px]">
                            <div className="truncate">{entry.title}</div>
                            {entry.description && (
                              <div className="text-xs text-slate-500 truncate">
                                {entry.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {entry.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {entry.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{entry.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Eye className="h-3 w-3 text-slate-400" />
                            <span className="text-sm">{entry.viewCount}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {new Date(entry.addedToLibraryAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingEntry({
                                jobId: entry.jobId,
                                jobTitle: entry.title,
                                meta: {
                                  libraryEnabled: true,
                                  libraryDescription: entry.description,
                                  libraryTags: entry.tags,
                                  libraryCategory: entry.category
                                }
                              })}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveFromLibrary(entry.jobId, entry.title)}
                              disabled={isActionLoading}
                            >
                              {isActionLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingEntry && (
        <LibraryDialog
          isOpen={true}
          onClose={() => setEditingEntry(null)}
          jobId={editingEntry.jobId}
          jobTitle={editingEntry.jobTitle}
          currentLibraryMeta={editingEntry.meta}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};