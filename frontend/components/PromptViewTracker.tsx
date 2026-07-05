"use client";
import { useEffect } from "react";

export default function PromptViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/prompts/${slug}/view`,
      { method: "POST" },
    ).catch(() => {});
  }, [slug]);
  return null;
}
