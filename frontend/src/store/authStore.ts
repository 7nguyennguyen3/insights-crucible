import { create } from "zustand";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

// This is the shape of the user object we want in our store
interface User {
  uid: string;
  name: string | null;
  email: string | null;
}

// Define the shape of the store's state and actions
interface AuthState {
  user: User | null;
  loading: boolean;
  initializeAuth: () => () => void; // Action now returns an unsubscribe function
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true, // Start in a loading state

  // This function will set up the real-time listener for auth changes
  initializeAuth: () => {
    // onAuthStateChanged returns an unsubscribe function that we can use for cleanup
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          // User is signed in
          set({
            user: {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName,
              email: firebaseUser.email,
            },
            loading: false,
          });
        } else {
          // User is signed out
          set({ user: null, loading: false });
        }
      }
    );

    // Return the unsubscribe function to be called on cleanup
    return unsubscribe;
  },
}));
