// components/Navbar.tsx

"use client";

import { auth } from "@/lib/firebaseClient";
import { useAuthStore } from "@/store/authStore";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import NotificationBell from "./NotificationBell";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  Loader2,
  LogOut,
  Map,
  Menu,
  Settings,
  Tags,
  User2,
  UserCircle,
  X,
  Zap,
} from "lucide-react";
import apiClient from "@/lib/apiClient";

const Navbar = () => {
  const { user, loading } = useAuthStore();

  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
      if (
        mobilePanelRef.current &&
        !mobilePanelRef.current.contains(event.target as Node) &&
        mobileMenuTriggerRef.current &&
        !mobileMenuTriggerRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await apiClient.post("/auth/signout");
      setIsProfileMenuOpen(false);
      setIsMobileMenuOpen(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const logoHref = "/";

  const renderDesktopMenu = () => {
    if (!isMounted) {
      return (
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      );
    }

    if (loading) {
      return <Loader2 className="h-6 w-6 animate-spin text-slate-500" />;
    }

    if (user) {
      return (
        <div className="flex items-center gap-3">
          <Link href="/engine">
            <Button className="bg-blue-600 hover:bg-blue-700 hidden sm:flex">
              <Zap className="h-4 w-4 mr-2" />
              Launch Engine
            </Button>
          </Link>
          <Link
            href="/dashboard"
            onClick={closeAllMenus}
            className="flex items-center px-3 py-2 text-base font-medium rounded-md text-black dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Button variant={"outline"}>
              <LayoutDashboard className="h-5 w-5 mr-3 " /> Dashboard
            </Button>
          </Link>

          <NotificationBell />

          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-white"
            >
              <span className="sr-only">Open user menu</span>
              <UserCircle className="h-6 w-6 text-black dark:text-slate-400 dark:hover:text-slate-200" />
            </button>
            <div
              className={`
                                origin-top-right absolute top-full right-0 mt-2 w-64 rounded-xl shadow-xl bg-white dark:bg-slate-800 ring-1 ring-slate-900/5
                                transition-all duration-150 ease-out z-50
                                ${
                                  isProfileMenuOpen
                                    ? "opacity-100 scale-100"
                                    : "opacity-0 scale-95 pointer-events-none"
                                }
                            `}
            >
              <div className="p-2">
                <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 mb-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Signed in as
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {user.email || "User"}
                  </p>
                </div>

                <Link
                  href="/account"
                  onClick={closeAllMenus}
                  className="flex items-center w-full text-left px-3 py-2 text-sm rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <User2 className="h-4 w-4 mr-3 text-slate-500 dark:text-slate-400" />{" "}
                  Account
                </Link>
                <Link
                  href="/account/setting"
                  onClick={closeAllMenus}
                  className="flex items-center w-full text-left px-3 py-2 text-sm rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Settings className="h-4 w-4 mr-3 text-slate-500 dark:text-slate-400" />{" "}
                  Setting
                </Link>
                <Link
                  href="/roadmap"
                  onClick={closeAllMenus}
                  className="flex items-center w-full text-left px-3 py-2 text-sm rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Map className="h-4 w-4 mr-3 text-slate-500 dark:text-slate-400" />{" "}
                  Roadmap
                </Link>
                <Link
                  href="/pricing"
                  onClick={closeAllMenus}
                  className="flex items-center w-full text-left px-3 py-2 text-sm rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Tags className="h-4 w-4 mr-3 text-slate-500 dark:text-slate-400" />{" "}
                  Pricing
                </Link>
                <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left flex items-center px-3 py-2 text-sm rounded-md text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4 mr-3" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // --- UPDATED LINKS FOR LOGGED-OUT USERS ---
    return (
      <div className="flex items-center gap-2">
        <Link href="/roadmap">
          <Button variant="ghost">Roadmap</Button>
        </Link>
        <Link href="/pricing">
          <Button variant="ghost">Pricing</Button>
        </Link>
        <Link href="/auth">
          <Button variant="ghost">Sign In</Button>
        </Link>
        <Link href="/auth?tab=signup">
          <Button>Sign Up</Button>
        </Link>
      </div>
    );
  };

  const renderMobileMenu = () => {
    return (
      <div ref={mobilePanelRef} className="md:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
          {user ? (
            <>
              <div className="flex flex-col gap-2 mt-5">
                <Link href="/engine" onClick={closeAllMenus}>
                  <Button className="w-full justify-start mb-2 bg-blue-600 hover:bg-blue-700 max-w-[200px]">
                    <Zap className="h-5 w-5 mr-3" /> Launch Engine
                  </Button>
                </Link>
                <Link href="/dashboard" onClick={closeAllMenus}>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start mb-2 max-w-[200px]"
                  >
                    <LayoutDashboard className="h-5 w-5 mr-3" /> Dashboard
                  </Button>
                </Link>
              </div>

              <Link
                href="/account"
                onClick={closeAllMenus}
                className="flex items-center px-3 py-2 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <User2 className="h-5 w-5 mr-3" /> Account
              </Link>
              <Link
                href="/account/setting"
                onClick={closeAllMenus}
                className="flex items-center px-3 py-2 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Settings className="h-5 w-5 mr-3" /> Setting
              </Link>
              <Link
                href="/roadmap"
                onClick={closeAllMenus}
                className="flex items-center px-3 py-2 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Map className="h-5 w-5 mr-3" /> Roadmap
              </Link>
              <Link
                href="/pricing"
                onClick={closeAllMenus}
                className="flex items-center px-3 py-2 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Tags className="h-5 w-5 mr-3" /> Pricing
              </Link>
              <div className="border-t border-slate-200 dark:border-slate-700 !my-2"></div>
              <button
                onClick={handleSignOut}
                className="w-full text-left flex items-center px-3 py-2 text-base font-medium rounded-md text-red-600 dark:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <LogOut className="h-5 w-5 mr-3" /> Sign Out
              </button>
            </>
          ) : (
            // --- UPDATED LINKS FOR LOGGED-OUT USERS (MOBILE) ---
            <div className="mt-5">
              <Link
                href="/pricing"
                onClick={closeAllMenus}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Pricing
              </Link>
              <Link
                href="/roadmap"
                onClick={closeAllMenus}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Roadmap
              </Link>
              <div className="flex flex-col gap-2">
                <Link href="/auth" onClick={closeAllMenus} className="">
                  <Button
                    variant={"outline"}
                    className="w-full mt-2 max-w-[200px]"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth?tab=signup" onClick={closeAllMenus}>
                  <Button className="w-full mt-2 max-w-[200px]">Sign Up</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <nav
      className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg 
    border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 p-1"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              href={logoHref}
              onClick={closeAllMenus}
              className="flex items-center"
            >
              {/* Light Mode Logo (Black Text) */}
              <img
                src={"/logo.svg"} // Path to your logo with BLACK text
                alt="Insights Crucible Logo"
                className="h-16 w-auto dark:hidden" // Visible in light mode, hidden in dark mode
              />

              {/* Dark Mode Logo (White Text) */}
              <img
                src={"/logo-dark.svg"} // Path to your logo with WHITE text
                alt="Insights Crucible Logo (Dark Mode)"
                className="h-16 w-auto hidden dark:block" // Hidden in light mode, visible in dark mode
              />
            </Link>
          </div>
          <div className="hidden md:flex md:items-center">
            {renderDesktopMenu()}
          </div>
          <div className="md:hidden flex items-center">
            {user && <NotificationBell />}
            <button
              ref={mobileMenuTriggerRef}
              id="mobile-menu-button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-black hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6 " aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          {renderMobileMenu()}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
