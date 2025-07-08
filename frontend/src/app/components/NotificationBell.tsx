// components/NotificationBell.tsx (Updated)

"use client";

import React, { useState } from "react";
import { useNotificationStore } from "@/store/notificationStore";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";

export default function NotificationBell() {
  const { notifications, unreadCount } = useNotificationStore();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiClient.post(`/notifications/mark-as-read`, { notificationId });
      // Real-time listener handles the UI update.
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  // --- NEW: Function to mark all as read ---
  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.post(`/notifications/mark-all-as-read`);
      // Real-time listener will update the UI for all notifications.
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    }
  };

  // --- NEW: This function handles both marking as read and closing the popover ---
  const handleNotificationClick = (notif: (typeof notifications)[0]) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    setIsPopoverOpen(false); // Close the popover on navigation
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="scale-125  text-black" />
          {unreadCount > 0 && (
            <span className="absolute top-[2px] right-[2px] flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 items-center justify-center text-xs font-bold text-white">
                {unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 border-b flex items-center justify-between">
          <h4 className="font-medium">Notifications</h4>
          {/* --- NEW: Mark all as read button --- */}
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="text-xs p-0 h-auto"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="p-2 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-4">
              You have no new notifications.
            </p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`w-full text-left p-2 rounded-lg flex items-start gap-3 ${
                  !notif.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                <div className="flex-1">
                  {/* --- UPDATED: Link now has onClick handler --- */}
                  <Link
                    href={notif.link}
                    onClick={() => handleNotificationClick(notif)}
                    className="hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
                  >
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </Link>
                </div>
                {!notif.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    title="Mark as read"
                    onClick={() => handleMarkAsRead(notif.id)}
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
