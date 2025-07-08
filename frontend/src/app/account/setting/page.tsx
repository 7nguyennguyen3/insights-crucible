"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useUserProfile } from "@/hooks/useUserProfile";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendEmailVerification,
  deleteUser,
} from "firebase/auth";
import { auth } from "@/lib/firebaseClient"; // CORRECT: Import client-side auth

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const SettingsPage = () => {
  const { user } = useAuthStore(); // We only need `user` for display purposes
  const { profile } = useUserProfile();

  // State for email verification
  const [isVerificationEmailSending, setIsVerificationEmailSending] =
    useState(false);

  // State for the password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // State for subscription management
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);

  // State for account deletion
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * Handles sending a verification email to the user.
   */
  const handleSendVerificationEmail = async () => {
    // We use auth.currentUser which is the live Firebase User object
    if (!auth.currentUser) return;
    setIsVerificationEmailSending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("A new verification email has been sent to your inbox.");
    } catch (error: any) {
      console.error("Verification email error:", error);
      toast.error(
        "Failed to send verification email. Please try again shortly."
      );
    } finally {
      setIsVerificationEmailSending(false);
    }
  };

  /**
   * Handles the password change logic with Firebase re-authentication.
   */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    // Use the live user from auth instance for security operations
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      setPasswordError("No user is currently signed in.");
      return;
    }

    setIsPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);

      setPasswordSuccess("Your password has been updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password Updated!");
    } catch (error: any) {
      console.error("Password change failed:", error);
      let errorMessage = "Failed to update password. Please try again.";
      if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect current password. Please try again.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later.";
      }
      setPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  /**
   * Handles creating a Stripe Billing Portal session.
   */
  const handleManageSubscription = async () => {
    if (!user) return;
    setIsSubscriptionLoading(true);
    try {
      const { data } = await apiClient.post("/billing/create-portal-session");
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Could not retrieve billing portal URL.");
      }
    } catch (err) {
      console.error("Failed to create portal session:", err);
      toast.error("Could not open billing portal. Please try again later.");
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  /**
   * Handles the account deletion process with re-authentication.
   */
  const handleDeleteAccount = async () => {
    setDeleteError(null);
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      setDeleteError("No user is signed in to delete.");
      return;
    }
    setIsDeleting(true);
    try {
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        deletePassword
      );

      await reauthenticateWithCredential(firebaseUser, credential);
      await deleteUser(firebaseUser);

      toast.success("Your account has been permanently deleted.");
      // CORRECT: No need to call setUser(null).
      // The onAuthStateChanged listener in useAuthStore will automatically
      // handle the state update upon successful deletion.

      // Redirect to homepage after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error: any) {
      console.error("Account deletion failed:", error);
      let errorMessage = "An error occurred while deleting your account.";
      if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Account deletion failed.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later.";
      }
      setDeleteError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 mb-20">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Settings
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          Manage your account, password, and subscription plan.
        </p>
      </header>

      <div className="space-y-8">
        {/* === Account Information Section === */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your personal information and contact details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || "Loading..."}
                readOnly
                disabled
              />
            </div>
            <div>
              <Label>Email Verification</Label>
              {auth.currentUser?.emailVerified ? (
                <Alert variant="default" className="mt-2">
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Verified</AlertTitle>
                  <AlertDescription>
                    Your email address has been successfully verified.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Not Verified</AlertTitle>
                  <AlertDescription>
                    Your email address is not verified. Please check your inbox
                    or resend the verification email.
                  </AlertDescription>
                  <Button
                    variant={"outline"}
                    className="mt-2 w-[180px] text-black"
                    onClick={handleSendVerificationEmail}
                    disabled={isVerificationEmailSending}
                  >
                    {isVerificationEmailSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend verification email"
                    )}
                  </Button>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* === Change Password Section === */}
        <Card>
          <form onSubmit={handleChangePassword}>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                For your security, you must provide your current password to
                make changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              {passwordError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              {passwordSuccess && (
                <Alert variant="default">
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{passwordSuccess}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="mt-6">
              <Button type="submit" disabled={isPasswordLoading}>
                {isPasswordLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Password
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* === Subscription Management Section === */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              Manage your billing information and view your current plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <p className="font-medium">Your current plan:</p>
              <Badge variant="secondary" className="text-base capitalize">
                {profile?.plan || "Loading..."}
              </Badge>
            </div>
          </CardContent>
          <CardFooter>
            {profile?.plan === "free" ? (
              <p className="text-sm text-slate-500">
                You are currently on the Free plan. Upgrade from the pricing
                page.
              </p>
            ) : (
              <Button
                onClick={handleManageSubscription}
                disabled={isSubscriptionLoading}
              >
                {isSubscriptionLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Manage Subscription & Billing
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* === Danger Zone === */}
        <Card className="border-red-500 dark:border-red-600">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-500">
              Danger Zone
            </CardTitle>
            <CardDescription>
              These actions are permanent and cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete My Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove your data from our servers. To
                    confirm, please enter your password.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <Label htmlFor="delete-password">Password</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password to confirm"
                  />
                  {deleteError && (
                    <p className="text-sm text-red-500">{deleteError}</p>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || !deletePassword}
                  >
                    {isDeleting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    I understand, delete my account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
