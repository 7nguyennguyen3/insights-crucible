"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useUserProfileStore } from "@/store/userProfileStore";

const AuthInitializer = () => {
  // Get the user object and the initializer function from the auth store
  const { user, initializeAuth } = useAuthStore();
  // Get the fetch and clear actions from the profile store
  const { fetchProfile, clearProfile } = useUserProfileStore();

  useEffect(() => {
    // Set up the Firebase onAuthStateChanged listener when the component mounts
    const unsubscribe = initializeAuth();

    // Clean up the listener when the component unmounts
    return () => {
      unsubscribe();
    };
  }, [initializeAuth]); // Run this effect only once

  useEffect(() => {
    // This effect runs whenever the 'user' object from useAuthStore changes
    if (user) {
      // If a user logs IN, fetch their application profile data
      fetchProfile();
    } else {
      // If a user logs OUT, clear their profile data from the store
      clearProfile();
    }
  }, [user, fetchProfile, clearProfile]); // Dependencies for this effect

  return null; // This component does not render anything
};

export default AuthInitializer;
