import useSWR from "swr";
import apiClient from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
// Define the shape of the profile data
interface UserProfile {
  plan: string;
  analyses_remaining: number;
  nextBillingDate?: number;
  cancel_at_period_end?: boolean;
  subscription_ends_at?: number;
}

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export const useUserProfile = () => {
  const { user } = useAuthStore();

  // The key is dynamic. If there's no user, the key is null and SWR won't fetch.
  const { data, error, isLoading, mutate } = useSWR<UserProfile>(
    user ? "/users/profile" : null,
    fetcher,
    {
      // Optional: prevent re-fetching on focus for this specific hook if desired
      revalidateOnFocus: false,
    }
  );

  return {
    profile: data,
    isLoading,
    isError: error,
    mutateProfile: mutate, // Expose the mutate function for manual updates
  };
};
