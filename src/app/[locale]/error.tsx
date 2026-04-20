"use client";

import { ServerCrash } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

import { Link } from "@/i18n/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);
  const title = "Something went wrong";
  const sorry = "An unexpected error occurred.";
  const tryAgain = "Try again";
  const returnHome = "Return home";

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-red-100">
        <ServerCrash className="w-10 h-10 text-red-600" />
      </div>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {title}
      </h1>
      <p className="mb-4 text-lg text-gray-600">{sorry}</p>
      <pre className="mb-8 w-full max-w-3xl overflow-auto rounded-md bg-muted p-4 text-left text-xs">
        {String(error?.message || error)}
        {error?.digest ? `\n\nDigest: ${error.digest}` : ""}
      </pre>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button onClick={() => reset()} variant="default">
          {tryAgain}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">{returnHome}</Link>
        </Button>
      </div>
    </div>
  );
}
