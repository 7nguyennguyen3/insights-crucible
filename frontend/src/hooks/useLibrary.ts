// hooks/useLibrary.ts

import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import apiClient from "@/lib/apiClient";
import { LibraryManagementEntry, LibraryStats } from "@/types/library";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export const useLibraryManagement = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "/library/my-contributions",
    fetcher,
    { revalidateOnFocus: false }
  );

  const contributions: LibraryManagementEntry[] = data?.contributions || [];
  const stats: LibraryStats = data?.stats || {
    totalEntries: 0,
    totalViews: 0,
    popularTags: [],
    recentActivity: []
  };

  return {
    contributions,
    stats,
    error,
    isLoading,
    mutate
  };
};

interface BulkLibraryMetadata {
  description: string;
  tags: string[];
  category?: string;
}

interface IndividualMetadata {
  description?: string;
  tags?: string[];
}

interface HybridBulkLibraryMetadata {
  jobIds: string[];
  sharedMetadata: BulkLibraryMetadata;
  individualOverrides: Record<string, IndividualMetadata>;
}

interface BulkLibraryResult {
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  results: {
    jobId: string;
    success: boolean;
    error?: string;
  }[];
}

export const useLibraryActions = () => {
  const [isLoading, setIsLoading] = useState(false);

  const addToLibrary = async (
    jobId: string,
    metadata: { description: string; tags: string[]; category?: string }
  ) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post(`/library/${jobId}`, metadata);
      toast.success("Analysis added to library successfully!");
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to add to library";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkAddToLibrary = async (
    jobIds: string[],
    metadata: BulkLibraryMetadata | HybridBulkLibraryMetadata
  ): Promise<BulkLibraryResult> => {
    setIsLoading(true);
    try {
      let requestData;
      if ('sharedMetadata' in metadata) {
        // New hybrid format
        requestData = metadata;
      } else {
        // Legacy format - convert to hybrid
        requestData = {
          jobIds,
          sharedMetadata: metadata,
          individualOverrides: {}
        };
      }

      const response = await apiClient.post('/library/bulk', requestData);

      const result: BulkLibraryResult = response.data;

      if (result.summary.successful > 0) {
        toast.success(
          `${result.summary.successful} of ${result.summary.total} analyses added to library successfully!`
        );
      }

      if (result.summary.failed > 0) {
        toast.warning(
          `${result.summary.failed} analyses could not be added to library.`
        );
      }

      return result;
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to add analyses to library";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkRemoveFromLibrary = async (jobIds: string[]): Promise<BulkLibraryResult> => {
    setIsLoading(true);
    try {
      const response = await apiClient.delete('/library/bulk', {
        data: { jobIds }
      });

      const result: BulkLibraryResult = response.data;

      if (result.summary.successful > 0) {
        toast.success(
          `${result.summary.successful} of ${result.summary.total} analyses removed from library successfully!`
        );
      }

      if (result.summary.failed > 0) {
        toast.warning(
          `${result.summary.failed} analyses could not be removed from library.`
        );
      }

      return result;
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to remove analyses from library";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLibraryMetadata = async (
    jobId: string,
    metadata: { description?: string; tags?: string[]; category?: string }
  ) => {
    setIsLoading(true);
    try {
      const response = await apiClient.put(`/library/${jobId}`, metadata);
      toast.success("Library metadata updated successfully!");
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to update metadata";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromLibrary = async (jobId: string) => {
    setIsLoading(true);
    try {
      await apiClient.delete(`/library/${jobId}`);
      toast.success("Analysis removed from library successfully!");
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to remove from library";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addToLibrary,
    bulkAddToLibrary,
    bulkRemoveFromLibrary,
    updateLibraryMetadata,
    removeFromLibrary,
    isLoading
  };
};

// Export types for use in components
export type { BulkLibraryMetadata, BulkLibraryResult, HybridBulkLibraryMetadata, IndividualMetadata };