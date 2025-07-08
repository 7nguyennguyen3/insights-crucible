"use client";

import { SWRConfig } from "swr";
import { Toaster } from "@/components/ui/sonner";
import { fetcher } from "@/lib/fetcher";
import AuthInitializer from "./AuthInitializer";
import NotificationListener from "./NotificationListener";

// This is a Client Component whose sole purpose is to wrap other client-side providers.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher }}>
      <AuthInitializer />
      <NotificationListener />
      {children}
      <Toaster position="top-right" />
    </SWRConfig>
  );
}
