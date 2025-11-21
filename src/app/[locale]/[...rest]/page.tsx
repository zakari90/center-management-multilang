import { notFound } from "next/navigation";

// This is a static catch-all route that always returns 404
export default function CatchAllPage() {
  notFound();
}

// Force static generation for this route but not for the other routes
export const dynamic = 'force-static';
export const revalidate = false;
