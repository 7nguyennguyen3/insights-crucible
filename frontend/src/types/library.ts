// Library-related types for the public analysis library feature

export interface LibraryMeta {
  libraryEnabled: boolean;
  libraryTags: string[];
  libraryDescription: string;
  libraryCategory?: string;
  addedToLibraryAt?: string; // ISO date string
}

export interface CreatorInfo {
  userId: string;
  displayName: string;
  avatar?: string;
}

export interface LibraryEntry {
  id: string; // Same as job_id
  publicShareId: string;
  title: string;
  description: string;
  tags: string[];
  category?: string;
  creator: CreatorInfo;
  viewCount: number;
  createdAt: string; // ISO date string
  addedToLibraryAt: string; // ISO date string
  analysisPersona: string;
  duration?: number; // in seconds
  sourceType: 'youtube' | 'upload' | 'paste';
  thumbnailUrl?: string; // For YouTube videos
  // Preview data for display
  previewData?: {
    sampleQuote?: string;
    keyInsight?: string;
    takeawayCount?: number;
  };
}

export interface LibraryFilters {
  search?: string;
  tags?: string[];
  category?: string;
  sourceType?: 'youtube' | 'upload' | 'paste';
  sortBy?: 'newest' | 'oldest' | 'mostViewed' | 'title';
  page?: number;
  limit?: number;
}

export interface LibraryResponse {
  entries: LibraryEntry[];
  total: number;
  page: number;
  totalPages: number;
  availableTags: string[];
  availableCategories: string[];
}

// This will be imported after the job types are defined
// Extended job data with library information will be defined in job.ts

// Library management types
export interface LibraryManagementEntry {
  jobId: string;
  title: string;
  description: string;
  tags: string[];
  category?: string;
  viewCount: number;
  addedToLibraryAt: string;
  lastUpdated?: string;
}

export interface LibraryStats {
  totalEntries: number;
  totalViews: number;
  popularTags: { tag: string; count: number }[];
  recentActivity: {
    type: 'view' | 'add' | 'update';
    jobId: string;
    title: string;
    timestamp: string;
  }[];
}