// components/Navbar.tsx

"use client";

import { auth } from "@/lib/firebaseClient";
import { useAuthStore } from "@/store/authStore";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import NotificationBell from "./NotificationBell";
import { CustomButton } from "@/components/common/CustomButton";
import { ROUTES } from "@/lib/constants";

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
  BookOpen,
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
    // This function remains unchanged
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
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex">
            <CustomButton
              href={ROUTES.ENGINE || "/engine"}
              variant="primary"
              className="shadow-lg px-4 py-2 text-sm h-10"
            >
              <Zap className="h-4 w-4" />
              Launch Engine
            </CustomButton>
          </div>
          <CustomButton
            href={ROUTES.DASHBOARD || "/dashboard"}
            variant="secondary"
            className="px-2 py-2 text-xs sm:px-4 sm:text-sm h-8 sm:h-10 flex-shrink-0 min-w-0"
          >
            <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-1">Dashboard</span>
          </CustomButton>

          <CustomButton
            href="/library"
            variant="secondary"
            className="px-2 py-2 text-xs sm:px-4 sm:text-sm h-8 sm:h-10 flex-shrink-0 min-w-0"
          >
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-1">Library</span>
          </CustomButton>

          <NotificationBell />

          <div className="relative" ref={profileMenuRef}>
            <Button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              variant={"ghost"}
            >
              <UserCircle className="scale-150" />
            </Button>
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
                  href="/#pricing"
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

    return (
      <div className="flex items-center gap-2">
        <Link href="/demo">
          <Button variant="ghost">Demo</Button>
        </Link>
        <Link href="/roadmap">
          <Button variant="ghost">Roadmap</Button>
        </Link>
        <Link href="/#pricing">
          <Button variant="ghost">Pricing</Button>
        </Link>
        <div className="border-l border-slate-200 dark:border-slate-700 h-6 mx-2"></div>
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
        {/* Use a flex column with consistent gap for better spacing */}
        <div className="flex flex-col gap-1 px-2 pt-2 pb-4 sm:px-3">
          {user ? (
            <>
              {/* Logged-in user links */}
              <div onClick={closeAllMenus}>
                <CustomButton
                  href={ROUTES.ENGINE || "/engine"}
                  variant="primary"
                  className="w-full justify-start text-base h-12"
                >
                  <Zap className="h-5 w-5" />
                  Launch Engine
                </CustomButton>
              </div>
              <div onClick={closeAllMenus} className="my-2">
                <CustomButton
                  href={ROUTES.DASHBOARD || "/dashboard"}
                  variant="secondary"
                  className="w-full justify-start text-base h-12"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </CustomButton>
              </div>
              <div onClick={closeAllMenus} className="mb-2">
                <CustomButton
                  href="/library"
                  variant="secondary"
                  className="w-full justify-start text-base h-12"
                >
                  <BookOpen className="h-5 w-5" />
                  Library
                </CustomButton>
              </div>

              {/* A separator for visual clarity */}
              <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>

              <Link
                href="/account"
                onClick={closeAllMenus}
                className="flex items-center px-3 py-3 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <User2 className="h-5 w-5 mr-3 text-slate-500" /> Account
              </Link>
              <Link
                href="/account/setting"
                onClick={closeAllMenus}
                className="flex items-center px-3 py-3 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Settings className="h-5 w-5 mr-3 text-slate-500" /> Setting
              </Link>
              <Link
                href="/roadmap"
                onClick={closeAllMenus}
                className="flex items-center px-3 py-3 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Map className="h-5 w-5 mr-3 text-slate-500" /> Roadmap
              </Link>
              <Link
                href="/#pricing"
                onClick={closeAllMenus}
                className="flex items-center px-3 py-3 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Tags className="h-5 w-5 mr-3 text-slate-500" /> Pricing
              </Link>

              <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>

              <button
                onClick={handleSignOut}
                className="w-full text-left flex items-center px-3 py-3 text-base font-medium rounded-md text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <LogOut className="h-5 w-5 mr-3" /> Sign Out
              </button>
            </>
          ) : (
            <>
              {/* Logged-out user links */}
              <Link
                href="/demo"
                onClick={closeAllMenus}
                className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Demo
              </Link>
              <Link
                href="/roadmap"
                onClick={closeAllMenus}
                className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Roadmap
              </Link>
              <Link
                href="/#pricing"
                onClick={closeAllMenus}
                className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Pricing
              </Link>

              {/* Sign in/up buttons with a separator above */}
              <div
                className="border-t border-slate-200 dark:border-slate-700 
              pt-4 mt-2 flex flex-col gap-2"
              >
                <div onClick={closeAllMenus}>
                  <CustomButton
                    href={ROUTES.AUTH || "/auth"}
                    variant="secondary"
                    className="w-full text-base h-11 max-w-[400px]"
                  >
                    Sign In
                  </CustomButton>
                </div>
                <div onClick={closeAllMenus}>
                  <CustomButton
                    href={ROUTES.AUTH_SIGNUP || "/auth?tab=signup"}
                    variant="primary"
                    className="w-full text-base h-11 max-w-[400px] mt-2"
                  >
                    Sign Up
                  </CustomButton>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <nav className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              href={logoHref}
              onClick={closeAllMenus}
              className="flex items-center"
            >
              <h3 className="font-montserrat font-bold text-lg">
                Insights
                <span className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
                  {" "}
                  Crucible
                </span>
              </h3>
            </Link>
          </div>
          <div className="hidden md:flex md:items-center">
            {renderDesktopMenu()}
          </div>
          <div className="md:hidden flex items-center gap-2">
            {" "}
            {/* Added gap-2 for spacing between bell and menu icon */}
            {user && <NotificationBell />}
            <button
              ref={mobileMenuTriggerRef}
              id="mobile-menu-button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Added transition classes for a smooth dropdown effect */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden md:hidden ${
          isMobileMenuOpen ? "max-h-screen" : "max-h-0"
        }`}
        id="mobile-menu"
      >
        {renderMobileMenu()}
      </div>
    </nav>
  );
};

export default Navbar;
