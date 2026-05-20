"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import type { PromptItem } from "@/lib/prompts";
import PromptFavoriteButton from "@/components/PromptFavoriteButton";

export default function PromptActions({ prompt }: { prompt: PromptItem }) {
  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt.promptZh);
    toast.success("提示词已复制");
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/prompts/${prompt.slug}/copy`,
      { method: "POST" },
    ).catch(() => {});
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <button
        onClick={copyPrompt}
        className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400"
      >
        复制中文提示词
      </button>
      <PromptFavoriteButton
        slug={prompt.slug}
        initialFavorited={prompt.isFavorited}
        initialCount={prompt.stat?.favorite_count}
      />
      <Link
        href={`/dashboard?text=${encodeURIComponent(prompt.promptZh)}`}
        className="rounded-lg bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        使用此提示词生成
      </Link>
    </div>
  );
}
