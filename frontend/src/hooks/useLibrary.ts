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
    updateLibraryMetadata,
    removeFromLibrary,
    isLoading
  };
};