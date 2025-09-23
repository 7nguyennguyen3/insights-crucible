"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updatePassword,
  sendEmailVerification,
  deleteUser,
} from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

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

interface CustomFirebaseError extends Error {
  code: string;
  message: string;
  name: string;
}

const SettingsPage = () => {
  const { user } = useAuthStore();

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

  // State for account deletion
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // New state to control dialog

  const [authProvider, setAuthProvider] = useState<string | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
      const providerId = auth.currentUser.providerData[0]?.providerId;
      setAuthProvider(providerId);
    }
  }, [user]);

  const handleSendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    setIsVerificationEmailSending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("A new verification email has been sent to your inbox.");
    } catch (error) {
      console.error("Verification email error:", error);
      toast.error(
        "Failed to send verification email. Please try again shortly."
      );
    } finally {
      setIsVerificationEmailSending(false);
    }
  };

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
    } catch (error) {
      console.error("Password change failed:", error);
      let errorMessage = "Failed to update password. Please try again.";

      if (typeof error === "object" && error !== null && "code" in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === "auth/wrong-password") {
          errorMessage = "Incorrect current password. Please try again.";
        } else if (firebaseError.code === "auth/too-many-requests") {
          errorMessage = "Too many attempts. Please try again later.";
        }
      }

      setPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    const firebaseUser = auth.currentUser; // Directly get current user from firebase/auth

    if (!firebaseUser) {
      toast.error("No user is signed in.");
      return;
    }

    setIsDeleting(true);

    try {
      // 1. Re-authenticate the user based on their provider
      // (Your existing re-authentication logic is correct)
      if (authProvider === "password") {
        if (!firebaseUser.email || !deletePassword) {
          setDeleteError("Password is required to delete your account.");
          setIsDeleting(false);
          return;
        }
        const credential = EmailAuthProvider.credential(
          firebaseUser.email,
          deletePassword
        );
        await reauthenticateWithCredential(firebaseUser, credential);
      } else if (authProvider === "google.com") {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(firebaseUser, provider);
      } else {
        setDeleteError(
          "Account deletion for this sign-in method is not fully supported yet (client-side only for now)."
        );
        setIsDeleting(false);
        return;
      }

      // 2. Get the ID token for the API call
      // Ensure the user has been recently re-authenticated, otherwise get an error like "auth/requires-recent-login"
      const idToken = await firebaseUser.getIdToken(true); // true forces a refresh if needed

      // 3. Call your API route to delete the Firestore record
      const apiResponse = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`, // Send the ID token for authentication
        },
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(
          errorData.error || "Failed to delete user record on server."
        );
      }

      // 4. Delete the Firebase Authentication user (client-side)
      await deleteUser(firebaseUser);
      await fetch("/api/auth/signout", { method: "POST" });

      toast.success(
        "Your account and all associated data have been permanently deleted."
      );
      setIsDeleteDialogOpen(false); // Close the dialog

      setTimeout(() => {
        window.location.href = "/"; // Redirect to home or login page
      }, 2000);
    } catch (error) {
      console.error("Account deletion failed:", error);
      let errorMessage = "An error occurred while deleting your account.";

      if (typeof error === "object" && error !== null && "code" in error) {
        // Assert to the more specific type
        const firebaseError = error as CustomFirebaseError; // Use the CustomFirebaseError type
        switch (firebaseError.code) {
          case "auth/wrong-password":
            errorMessage = "Incorrect password. Account deletion failed.";
            break;
          case "auth/too-many-requests":
            errorMessage = "Too many attempts. Please try again later.";
            break;
          case "auth/popup-closed-by-user":
            errorMessage = "Re-authentication cancelled. Please try again.";
            break;
          case "auth/requires-recent-login":
            errorMessage =
              "Please log in again to delete your account. This is a security measure.";
            break;
          default:
            // Now 'firebaseError.message' is properly recognized
            errorMessage =
              firebaseError.message ||
              "Re-authentication or deletion failed. Please try again.";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message; // Catch errors from the API fetch or other general JS errors
      }

      setDeleteError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };
  const handleDialogChange = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setDeletePassword("");
      setDeleteError(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto min-h-screen py-12 px-4 sm:px-6 lg:px-8 mb-20">
      <header className="mt-30">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Settings
        </h1>
        <p className="my-2 text-lg text-slate-600 dark:text-slate-400">
          Manage your account and password settings.
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
                    Your email is not verified. Please check your inbox or
                    resend the verification email.
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
        {authProvider === "password" ? (
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
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
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
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You are signed in with a social account. Password management is
                handled by your provider.
              </p>
            </CardContent>
          </Card>
        )}

        {/* === Danger Zone === */}
        <Card className="border-red-500 dark:border-red-600">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-500">
              Danger Zone
            </CardTitle>
            <CardDescription>
              This action is permanent and cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog onOpenChange={handleDialogChange} open={isDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete My Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action is permanent and cannot be undone. All files,
                    records, and data associated with your account will be
                    permanently deleted and unrecoverable. To confirm, please
                    re-authenticate.
                  </DialogDescription>
                </DialogHeader>
                {authProvider === "password" ? (
                  <div className="py-4 space-y-2">
                    <Label htmlFor="delete-password">Password</Label>
                    <Input
                      id="delete-password"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Enter your password to confirm"
                    />
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      You signed in with Google. Please continue to
                      re-authenticate and confirm deletion.
                    </p>
                  </div>
                )}
                {deleteError && (
                  <p className="text-sm text-red-500 mt-2">{deleteError}</p>
                )}

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" disabled={isDeleting}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={
                      isDeleting ||
                      (authProvider === "password" && !deletePassword)
                    }
                  >
                    {isDeleting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {authProvider === "google.com"
                      ? "Continue with Google to Delete"
                      : "I understand, delete my account"}
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
