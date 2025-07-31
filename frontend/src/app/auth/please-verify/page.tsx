// src/app/auth/please-verify/page.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function PleaseVerifyPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md mx-4 text-center">
        <CardHeader>
          <div className="mx-auto bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
            <MailCheck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">
            Please Verify Your Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A verification link has been sent to your email address. Please
            click the link to continue.
          </p>

          <Link
            href="/auth?tab=signin"
            className="inline-block mt-6 text-sm text-blue-600 hover:underline"
          >
            Back to Sign In
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
