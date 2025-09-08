"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { useJobs } from "@/hooks/useJobs";
import { useFolders } from "@/hooks/useFolders";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Job, JobStatus } from "../_global/interface";
import {
  backgroundVariants,
  containerVariants,
  spacingVariants,
  gridPatterns,
} from "@/styles/variants";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  MoreVertical,
  Trash2,
  Pencil,
  Search,
  X,
  Star,
  Move as MoveIcon,
  Folder as FolderIcon,
  LayoutDashboard,
  Calendar as CalendarIcon,
} from "lucide-react";
import FolderSidebar from "../components/FolderSidebar";
import withAuth from "../auth/components/withAuth";

const getStatusProps = (status: JobStatus) => {
  switch (status) {
    case "COMPLETED":
      return {
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 border-green-300 dark:border-green-700",
        icon: <CheckCircle className="h-4 w-4" />,
      };
    case "PROCESSING":
      return {
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 border-blue-300 dark:border-blue-700",
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
      };
    case "FAILED":
      return {
        className:
          "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 border-red-300 dark:border-red-700",
        icon: <AlertCircle className="w-4 h-4" />,
      };
    default:
      return { variant: "outline", icon: <Loader2 className="w-4 h-4" /> };
  }
};

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

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) =>
        job.job_title.toLowerCase().includes(searchTerm.toLowerCase())
      )
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
  }, [jobs, searchTerm, dateRange]);

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
        {/* Background Elements */}
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
              <FolderSidebar
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />

              <main className="flex-1">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder="Search by title..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

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

                  {(searchTerm || dateRange) && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearchTerm("");
                        setDateRange(undefined);
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear Filters
                    </Button>
                  )}
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
                      {filteredJobs.map((job) => {
                        const statusProps = getStatusProps(job.status);
                        const isProcessing = job.status === "PROCESSING";

                        return (
                          <Card
                            key={job.id}
                            className="flex flex-col hover:shadow-xl transition-shadow duration-300 dark:bg-slate-900"
                          >
                            <CardHeader>
                              <div className="flex justify-between items-start gap-2 min-w-0">
                                <CardTitle className="flex items-center gap-2 text-xl mr-2 flex-1 min-w-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 -ml-2"
                                    onClick={() => handleToggleStar(job)}
                                  >
                                    <Star
                                      className={cn(
                                        "h-5 w-5 transition-all",
                                        job.isStarred
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-slate-400"
                                      )}
                                    />
                                    <span className="sr-only">
                                      Toggle Favorite
                                    </span>
                                  </Button>
                                  <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                                  <span className="truncate">
                                    {job.job_title || job.id}
                                  </span>
                                </CardTitle>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 shrink-0"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setJobToEdit(job);
                                        setNewTitle(job.job_title);
                                        setIsRenameDialogOpen(true);
                                      }}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Rename
                                    </DropdownMenuItem>

                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>
                                        <MoveIcon className="mr-2 h-4 w-4" />
                                        <span>Move to...</span>
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleMoveJob(job.id, null)
                                          }
                                          disabled={!job.folderId}
                                        >
                                          <LayoutDashboard className="mr-2 h-4 w-4" />
                                          Unfiled
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {folders.map((folder) => (
                                          <DropdownMenuItem
                                            key={folder.id}
                                            onClick={() =>
                                              handleMoveJob(job.id, folder.id)
                                            }
                                            disabled={
                                              job.folderId === folder.id
                                            }
                                          >
                                            <FolderIcon className="mr-2 h-4 w-4" />
                                            {folder.name}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      className="text-red-500"
                                      onClick={() => {
                                        setJobToEdit(job);
                                        setIsDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <CardDescription className="flex items-center gap-2 pt-1">
                                <CalendarIcon className="w-4 h-4" />
                                <span>
                                  {new Date(job.createdAt).toLocaleDateString()}
                                </span>
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                              <Badge
                                variant="outline"
                                className={statusProps.className}
                              >
                                {statusProps.icon}
                                <span className="ml-2">{job.status}</span>
                              </Badge>

                              {isProcessing && job.progress && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                                  <p className="truncate">{job.progress}</p>
                                </div>
                              )}
                            </CardContent>
                            <CardFooter>
                              {job.status === "COMPLETED" ? (
                                <Link
                                  href={`/results/${job.id}`}
                                  className="w-full"
                                  passHref
                                >
                                  <Button className="w-full">
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Results
                                  </Button>
                                </Link>
                              ) : (
                                <Button className="w-full" disabled>
                                  {job.status === "PROCESSING" && (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  )}
                                  {job.status === "FAILED" && (
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                  )}
                                  {job.status === "QUEUED" && (
                                    <Loader2 className="w-4 h-4 mr-2" />
                                  )}
                                  {job.status}
                                </Button>
                              )}
                            </CardFooter>
                          </Card>
                        );
                      })}
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
