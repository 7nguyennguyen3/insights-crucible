import { create } from "zustand";

interface UserProfile {
  plan: string;
}

interface UserProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  fetchProfile: () => Promise<void>;
  clearProfile: () => void;
}

// We will get the apiClient from a separate file to avoid circular dependencies
import apiClient from "@/lib/apiClient";

export const useUserProfileStore = create<UserProfileState>((set) => ({
  profile: null,
  isLoading: true,
  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get("/users/profile");
      set({ profile: response.data, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      set({ profile: null, isLoading: false });
    }
  },
  clearProfile: () => set({ profile: null, isLoading: false }),
}));
