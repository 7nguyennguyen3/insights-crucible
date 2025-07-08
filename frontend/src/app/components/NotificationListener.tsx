"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { db } from "@/lib/firebaseClient";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Notification } from "../_global/interface";
import { useSWRConfig } from "swr"; // <-- 1. Import the SWR config hook

export default function NotificationListener() {
  const { user } = useAuthStore();
  const { setNotifications } = useNotificationStore();
  const { mutate } = useSWRConfig(); // <-- 2. Get the global mutate function

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const notificationsRef = collection(
      db,
      "saas_users",
      user.uid,
      "notifications"
    );
    const q = query(notificationsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsData: Notification[] = [];
      let shouldRefetchProfile = false;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const notification: Notification = {
          id: doc.id,
          message: data.message,
          link: data.link,
          isRead: data.isRead,
          createdAt:
            data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        };
        notificationsData.push(notification);

        // Check if a new, unread notification is about a completed job
        if (!data.isRead && data.message.includes("is complete")) {
          shouldRefetchProfile = true;
        }
      });

      // Update the notifications in our store
      setNotifications(notificationsData);

      // --- 3. THE FIX ---
      // If we received a job completion notification, tell SWR to
      // re-fetch the data for the user's profile.
      if (shouldRefetchProfile) {
        console.log("Job completed, triggering profile refetch...");
        mutate("/api/users/profile");
      }
      // --- END FIX ---
    });

    return () => unsubscribe();
  }, [user, setNotifications, mutate]);

  return null;
}
