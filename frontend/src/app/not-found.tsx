import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, ArrowLeft } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="max-w-md w-full">
        <div className="mb-8">
          <Compass className="mx-auto h-20 w-20 text-blue-500" />
        </div>
        <h1 className="text-6xl md:text-8xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tighter">
          404
        </h1>
        <h2 className="mt-4 text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">
          Page Not Found
        </h2>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Oops! The page you are looking for does not exist. It might have been
          moved or deleted.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Return to Homepage
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/help-center">Visit Help Center</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
