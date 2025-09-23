import useSWRInfinite from "swr/infinite";
import { useAuthStore } from "@/store/authStore";
import { db } from "@/lib/firebaseClient";
import {
  collection,
  query,
  orderBy,
  startAfter,
  limit,
  getDocs,
  Timestamp,
  where,
  QueryConstraint,
} from "firebase/firestore";
import { Job } from "@/app/_global/interface";
import { convertFirestoreTimestamp } from "@/lib/utils";

const PAGE_SIZE = 6;

const jobsFetcher = async (
  key: [string, string, string | null]
): Promise<Job[]> => {
  try {
    const [_path, activeFilter, cursor] = key;
    const userId = useAuthStore.getState().user?.uid;

    if (!userId) {
      // Return an empty array if the user is not logged in, preventing an error throw.
      return [];
    }

    const jobsCollectionRef = collection(db, "saas_users", userId, "jobs");

    // Use a specific type for query constraints
    const queryConstraints: QueryConstraint[] = [];

    if (activeFilter === "starred") {
      queryConstraints.push(where("isStarred", "==", true));
    } else if (activeFilter !== "all") {
      queryConstraints.push(where("folderId", "==", activeFilter));
    }

    // Always order by createdAt
    queryConstraints.push(orderBy("createdAt", "desc"));
    queryConstraints.push(limit(PAGE_SIZE));

    if (cursor) {
      // The cursor is a timestamp in milliseconds, convert it to a number
      const numericCursor = Number(cursor);
      queryConstraints.push(startAfter(Timestamp.fromMillis(numericCursor)));
    }

    const q = query(jobsCollectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    const jobsData: Job[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      jobsData.push({
        id: doc.id,
        status: data.status,
        createdAt: convertFirestoreTimestamp(data.createdAt),
        job_title: data.job_title,
        progress: data.progress,
        isStarred: data.isStarred || false,
        folderId: data.folderId || null,
        sourceType: data.request_data?.source_type || data.sourceType,
        youtubeUrl: data.request_data?.youtube_url || data.youtubeUrl,
        youtubeChannelName: data.request_data?.youtube_channel_name || data.youtubeChannelName,
        youtubeVideoName: data.request_data?.youtube_video_title || data.youtubeVideoName,
        youtubeDuration: data.request_data?.youtube_duration || data.youtubeDuration,
        youtubeThumbnailUrl: data.request_data?.youtube_thumbnail_url || data.youtubeThumbnailUrl,
        analysisPersona: data.analysisPersona || data.request_data?.config?.analysis_persona,
        audioFilename: data.request_data?.audio_filename || data.audioFilename,
        durationSeconds: data.request_data?.duration_seconds || data.durationSeconds,
        libraryDescriptionSuggestion: data.libraryDescriptionSuggestion,
        libraryTagsSuggestion: data.libraryTagsSuggestion,
        libraryMeta: data.libraryMeta,
      });
    });

    return jobsData;
  } catch (err) {
    console.error("🔥 Error in jobsFetcher:", err);
    throw err; // Re-throw to let SWR know about the failure
  }
};

export const useJobs = (activeFilter: string) => {
  const { user } = useAuthStore();

  const getKey = (
    pageIndex: number,
    previousPageData: Job[] | null
  ): [string, string, string | null] | null => {
    if (!user) return null;
    if (previousPageData && previousPageData.length < PAGE_SIZE) return null;
    if (pageIndex === 0) return [`/users/${user.uid}/jobs`, activeFilter, null];

    const lastJob = previousPageData?.[previousPageData.length - 1];
    if (!lastJob?.createdAt) return null;

    const cursor = new Date(lastJob.createdAt).getTime().toString();
    return [`/users/${user.uid}/jobs`, activeFilter, cursor];
  };

  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite<
    Job[]
  >(getKey, jobsFetcher, {
    revalidateOnFocus: false,
    refreshInterval: (latestData) => {
      const hasProcessingJob = latestData
        ?.flat()
        .some((job) => job.status === "PROCESSING" || job.status === "QUEUED");
      return hasProcessingJob ? 3000 : 0;
    },
  });

  const jobs = data ? ([] as Job[]).concat(...data) : [];
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const hasMore = data
    ? (data[data.length - 1]?.length || 0) === PAGE_SIZE
    : true;

  return {
    jobs,
    data,
    error,
    isLoading,
    isLoadingMore,
    size,
    setSize,
    hasMore,
    mutate,
  };
};
