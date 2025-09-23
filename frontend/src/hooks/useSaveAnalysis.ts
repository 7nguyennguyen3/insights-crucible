import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

interface SaveAnalysisRequest {
  publicShareId: string;
  customTitle?: string;
}

interface SaveAnalysisResponse {
  success: boolean;
  jobId?: string;
  message: string;
  creditsRemaining?: number;
}

interface UseSaveAnalysisOptions {
  onSuccess?: (response: SaveAnalysisResponse) => void;
  onError?: (error: string) => void;
}

export const useSaveAnalysis = (options?: UseSaveAnalysisOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const router = useRouter();

  const saveAnalysis = async (request: SaveAnalysisRequest) => {
    // Check if user is authenticated
    if (!user) {
      // Redirect to auth page with return URL
      const currentUrl = window.location.pathname + window.location.search;
      const authUrl = `/auth?returnUrl=${encodeURIComponent(currentUrl)}`;
      router.push(authUrl);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<SaveAnalysisResponse>(
        "/save-analysis",
        request
      );

      if (response.data.success) {
        toast.success("Analysis saved to your dashboard!", {
          description: `${response.data.creditsRemaining?.toFixed(1)} credits remaining`,
          action: response.data.jobId
            ? {
                label: "View",
                onClick: () => router.push(`/results/${response.data.jobId}`),
              }
            : undefined,
        });

        options?.onSuccess?.(response.data);
      } else {
        const errorMsg = response.data.message || "Failed to save analysis";
        setError(errorMsg);
        toast.error(errorMsg);
        options?.onError?.(errorMsg);
      }
    } catch (err: any) {
      let errorMessage = "Failed to save analysis";

      if (err.response?.status === 401) {
        errorMessage = "Please sign in to save this analysis";
        // Redirect to auth page
        const currentUrl = window.location.pathname + window.location.search;
        const authUrl = `/auth?returnUrl=${encodeURIComponent(currentUrl)}`;
        router.push(authUrl);
        return;
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.message || "Invalid request";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
      options?.onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfUserCanSave = () => {
    return !!user;
  };

  const getAuthRedirectUrl = () => {
    const currentUrl = window.location.pathname + window.location.search;
    return `/auth?returnUrl=${encodeURIComponent(currentUrl)}`;
  };

  return {
    saveAnalysis,
    isLoading,
    error,
    checkIfUserCanSave,
    getAuthRedirectUrl,
    isAuthenticated: !!user,
  };
};