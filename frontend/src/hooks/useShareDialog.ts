// app/hooks/useShareDialog.ts

import { useState, useEffect } from "react";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";

// The hook accepts the jobId and the original data's public share properties
export const useShareDialog = (
  jobId: string,
  isPublic: boolean | undefined,
  publicShareId: string | undefined,
  mutate: () => void // SWR's mutate function
) => {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isLinkLoading, setIsLinkLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (isPublic && publicShareId) {
      setShareUrl(`${process.env.NEXT_PUBLIC_APP_URL}/share/${publicShareId}`);
    } else {
      setShareUrl(null);
    }
  }, [isPublic, publicShareId]);

  const handleCreateShareLink = async () => {
    setIsLinkLoading(true);
    try {
      const response = await apiClient.post(`/jobs/${jobId}/share`);
      setShareUrl(response.data.shareUrl);
      toast.success("Public share link created!");
      mutate();
    } catch (err) {
      toast.error("Could not create public link.");
    } finally {
      setIsLinkLoading(false);
    }
  };

  const handleRevokeShareLink = async () => {
    setIsLinkLoading(true);
    try {
      await apiClient.delete(`/jobs/${jobId}/share`);
      setShareUrl(null);
      toast.success("Public access has been revoked.");
      mutate();
    } catch (err) {
      toast.error("Could not revoke public link.");
    } finally {
      setIsLinkLoading(false);
    }
  };

  const copyShareLinkToClipboard = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setHasCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setHasCopied(false), 2500);
  };

  return {
    isShareDialogOpen,
    setIsShareDialogOpen,
    shareUrl,
    isLinkLoading,
    hasCopied,
    handleCreateShareLink,
    handleRevokeShareLink,
    copyShareLinkToClipboard,
  };
};
