import useSWR from "swr";
import apiClient from "@/lib/apiClient";

// Define the shape of a single Folder object for the frontend
export interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

// The fetcher function simply calls our new API endpoint
const foldersFetcher = async (url: string): Promise<Folder[]> => {
  const response = await apiClient.get(url);
  return response.data;
};

export const useFolders = () => {
  const { data, error, isLoading, mutate } = useSWR<Folder[]>(
    "/folders/list", // The key is the API endpoint
    foldersFetcher
  );

  return {
    folders: data || [], // Return an empty array if data is not yet available
    isLoading,
    error,
    mutate, // We'll need this to refresh the list after creating a new folder
  };
};
