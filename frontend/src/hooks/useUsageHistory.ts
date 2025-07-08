import useSWRInfinite from "swr/infinite";
import apiClient from "@/lib/apiClient";
import type { UsageRecord } from "@/app/api/usage/history/route";

interface PaginatedUsageResponse {
  records: UsageRecord[];
  hasMore: boolean;
}

const usageFetcher = async (url: string, cursor: number | null) => {
  const res = await apiClient.post(url, { cursor });
  return res.data;
};

export const useUsageHistory = () => {
  const getKey = (
    pageIndex: number,
    previousPageData: PaginatedUsageResponse | null
  ) => {
    // Reached the end
    if (previousPageData && !previousPageData.hasMore) return null;

    // First page, no cursor
    if (pageIndex === 0) return ["/usage/history", null];

    // Subsequent pages, use the last item's createdAt timestamp as the cursor
    const lastRecord =
      previousPageData?.records[previousPageData.records.length - 1];
    if (!lastRecord) return null;

    const cursor = new Date(lastRecord.createdAt).getTime();
    return ["/usage/history", cursor];
  };

  const { data, error, isLoading, size, setSize, mutate } =
    useSWRInfinite<PaginatedUsageResponse>(
      getKey,
      (args) => usageFetcher(args[0], args[1]),
      { revalidateOnFocus: false }
    );

  const paginatedRecords = data
    ? ([] as UsageRecord[]).concat(...data.map((page) => page.records))
    : [];
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const hasMore = data ? data[data.length - 1]?.hasMore : false;

  return {
    usageHistory: paginatedRecords,
    error,
    isLoading,
    isLoadingMore,
    size,
    setSize,
    hasMore,
    mutate,
  };
};
