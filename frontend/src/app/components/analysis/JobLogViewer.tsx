"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebaseClient"; // Ensure this path is correct
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp, // Import the Timestamp type from Firestore
} from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

// Define the structure of a single log entry
interface LogEntry {
  id: string;
  message: string;
  timestamp: Timestamp; // Use the specific Firestore Timestamp type
}

// Define the props for our component
interface JobLogViewerProps {
  userId: string;
  jobId: string;
}

// A simple utility to format Firestore Timestamps, returns HH:MM:SS
const formatTimestamp = (timestamp: Timestamp | null): string => {
  if (!timestamp || typeof timestamp.toDate !== "function") return "...";
  return timestamp.toDate().toLocaleTimeString();
};

export default function JobLogViewer({ userId, jobId }: JobLogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const logsEndRef = useRef<HTMLDivElement | null>(null); // Type the ref

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [logs]);

  useEffect(() => {
    if (!userId || !jobId) return;

    setIsLoading(true);

    const logsQuery = query(
      collection(db, `saas_users/${userId}/jobs/${jobId}/logs`),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      logsQuery,
      (querySnapshot) => {
        const newLogs: LogEntry[] = [];
        querySnapshot.forEach((doc) => {
          // We cast the document data to ensure it matches our LogEntry structure
          const data = doc.data() as Omit<LogEntry, "id">;
          newLogs.push({ id: doc.id, ...data });
        });
        setLogs(newLogs);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error listening to logs:", error);
        setIsLoading(false);
      }
    );

    // Cleanup function to unsubscribe from the listener on component unmount
    return () => unsubscribe();
  }, [userId, jobId]);

  if (isLoading && logs.length === 0) {
    return (
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-slate-300 font-mono text-sm p-4 mt-2 rounded-md h-60 overflow-y-auto border border-slate-700">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-4 leading-relaxed">
          <span className="text-slate-500 select-none">
            [{formatTimestamp(log.timestamp)}]
          </span>
          <span className="flex-1 whitespace-pre-wrap break-words">
            {log.message}
          </span>
        </div>
      ))}
      <div ref={logsEndRef} />
    </div>
  );
}
