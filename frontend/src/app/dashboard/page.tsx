"use client";

import {
  EnhancedSearch,
  SearchCriteria,
} from "@/components/dashboard/EnhancedSearch";
import { useFolders } from "@/hooks/useFolders";
import { useJobs } from "@/hooks/useJobs";
import apiClient from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import {
  backgroundVariants,
  containerVariants,
  gridPatterns,
  spacingVariants,
} from "@/styles/variants";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Job } from "../_global/interface";

import JobCard from "@/components/dashboard/JobCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar as CalendarIcon, // Added User icon for channel name
  Filter,
  Loader2,
} from "lucide-react";
import withAuth from "../auth/components/withAuth";
import FolderSidebar from "../components/FolderSidebar";

const DashboardPage = () => {
  const { user, loading: authLoading } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState("all");

  const {
    jobs,
    data,
    error,
    isLoading,
    isLoadingMore,
    size,
    setSize,
    hasMore,
    mutate: mutateJobs,
  } = useJobs(activeFilter);

  const { folders } = useFolders();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    titleSearch: "",
    sourceType: "all",
    youtubeUrl: "",
    channelName: "",
    videoName: "",
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (error) {
      console.error(
        "Dashboard page received an error from useJobs hook:",
        error
      );
    }
  }, [error]);

  const handleDelete = async () => {
    if (!jobToEdit) return;
    setIsDeleteDialogOpen(false);
    try {
      await apiClient.post("/jobs/delete", { jobId: jobToEdit.id });
      toast.success(`Analysis "${jobToEdit.job_title}" deleted.`);
      mutateJobs();
    } catch (err) {
      toast.error("Failed to delete analysis.");
    } finally {
      setJobToEdit(null);
    }
  };

  const handleRename = async () => {
    if (!jobToEdit || !newTitle.trim()) return;
    try {
      await apiClient.post("/jobs/rename", {
        jobId: jobToEdit.id,
        newTitle: newTitle.trim(),
      });
      toast.success(`Analysis renamed to "${newTitle.trim()}".`);
      mutateJobs();
    } catch (err) {
      toast.error("Failed to rename analysis.");
    } finally {
      setIsRenameDialogOpen(false);
      setJobToEdit(null);
      setNewTitle("");
    }
  };

  const handleToggleStar = async (job: Job) => {
    const newIsStarred = !job.isStarred;
    try {
      toast.success(
        `Analysis "${job.job_title}" ${newIsStarred ? "starred" : "unstarred"}.`
      );
      await apiClient.post("/jobs/toggle-star", { jobId: job.id });
      mutateJobs();
    } catch (err) {
      toast.error("Failed to update favorite status.");
    }
  };

  const handleMoveJob = async (jobId: string, folderId: string | null) => {
    try {
      await apiClient.post("/jobs/move", { jobId, folderId });
      toast.success("Analysis moved successfully.");
      mutateJobs();
    } catch (err) {
      toast.error("Failed to move analysis.");
    }
  };

  const handleRenameClick = (job: Job) => {
    setJobToEdit(job);
    setNewTitle(job.job_title);
    setIsRenameDialogOpen(true);
  };

  const handleDeleteClick = (job: Job) => {
    setJobToEdit(job);
    setIsDeleteDialogOpen(true);
  };

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        const titleMatch =
          job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.job_title
            .toLowerCase()
            .includes(searchCriteria.titleSearch.toLowerCase());

        const sourceTypeMatch =
          searchCriteria.sourceType === "all" ||
          job.sourceType === searchCriteria.sourceType;

        const urlMatch =
          !searchCriteria.youtubeUrl ||
          (job.youtubeUrl &&
            job.youtubeUrl
              .toLowerCase()
              .includes(searchCriteria.youtubeUrl.toLowerCase()));

        const channelMatch =
          !searchCriteria.channelName ||
          (job.youtubeChannelName &&
            job.youtubeChannelName
              .toLowerCase()
              .includes(searchCriteria.channelName.toLowerCase()));

        const videoNameMatch =
          !searchCriteria.videoName ||
          job.job_title
            .toLowerCase()
            .includes(searchCriteria.videoName.toLowerCase()) ||
          (job.youtubeVideoName &&
            job.youtubeVideoName
              .toLowerCase()
              .includes(searchCriteria.videoName.toLowerCase()));

        return (
          titleMatch &&
          sourceTypeMatch &&
          urlMatch &&
          channelMatch &&
          videoNameMatch
        );
      })
      .filter((job) => {
        if (!dateRange?.from) {
          return true;
        }
        const jobDate = new Date(job.createdAt);
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);

        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return jobDate >= fromDate && jobDate <= toDate;
        }
        return jobDate >= fromDate;
      });
  }, [jobs, searchTerm, searchCriteria, dateRange]);

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="flex flex-col">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="flex-grow space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-28" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  if (authLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div
        className={`min-h-screen w-full ${backgroundVariants.universal} text-slate-800 dark:text-slate-200 relative overflow-hidden`}
      >
        <div className={`absolute inset-0 ${gridPatterns.subtle}`} />
        <div
          className={`relative ${spacingVariants.heroPadding} ${containerVariants.section}`}
        >
          <div className="max-w-7xl mx-auto">
            <header className="mb-10">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                My Analyses
              </h1>
              <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
                Review your past transcript analysis jobs and results.
              </p>
            </header>
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
              <div className={`md:block ${!isSidebarOpen ? "hidden" : ""}`}>
                <FolderSidebar
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />
              </div>
              <main className="flex-1">
                <div className="md:hidden mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {isSidebarOpen ? "Hide Filters" : "Show Filters"}
                  </Button>
                </div>
                <div className="mb-8">
                  <EnhancedSearch
                    searchCriteria={searchCriteria}
                    onSearchChange={setSearchCriteria}
                    onClearSearch={() => {
                      setSearchCriteria({
                        titleSearch: "",
                        sourceType: "all",
                        youtubeUrl: "",
                        channelName: "",
                        videoName: "",
                      });
                      setSearchTerm("");
                      setDateRange(undefined);
                    }}
                    hasActiveFilters={
                      searchCriteria.titleSearch !== "" ||
                      searchCriteria.sourceType !== "all" ||
                      searchCriteria.youtubeUrl !== "" ||
                      searchCriteria.channelName !== "" ||
                      searchCriteria.videoName !== "" ||
                      searchTerm !== "" ||
                      !!dateRange
                    }
                  />
                  <div className="flex flex-col md:flex-row gap-4 mt-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant={"outline"}
                          className={cn(
                            "w-full md:w-[300px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {isLoading && jobs.length === 0 ? (
                  renderSkeleton()
                ) : error ? (
                  <p className="text-red-500 text-center">
                    Failed to load analysis history.
                  </p>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">No Analyses Found</h3>
                    <p className="text-slate-500 mt-2">
                      No results match your current filter criteria.
                    </p>
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => {
                        setSearchCriteria({
                          titleSearch: "",
                          sourceType: "all",
                          youtubeUrl: "",
                          channelName: "",
                          videoName: "",
                        });
                        setSearchTerm("");
                        setDateRange(undefined);
                        setActiveFilter("all");
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          folders={folders}
                          onRename={handleRenameClick}
                          onDelete={handleDeleteClick}
                          onToggleStar={handleToggleStar}
                          onMove={handleMoveJob}
                        />
                      ))}
                    </div>
                    {hasMore && (
                      <div className="flex justify-center mt-8">
                        <Button
                          onClick={() => setSize(size + 1)}
                          disabled={isLoadingMore}
                        >
                          {isLoadingMore ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            "Load More"
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              analysis for "{jobToEdit?.job_title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for "{jobToEdit?.job_title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New analysis name..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRename}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default withAuth(DashboardPage);
