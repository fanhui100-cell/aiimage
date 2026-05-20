"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "prompt123:favorites";

function readFavorites() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set<string>();
  }
}

export default function PromptFavoriteButton({
  slug,
  compact = false,
  initialFavorited = false,
  initialCount,
}: {
  slug: string;
  compact?: boolean;
  initialFavorited?: boolean;
  initialCount?: number;
}) {
  const [active, setActive] = useState(initialFavorited);
  const [count] = useState(initialCount);

  useEffect(() => {
    setActive(readFavorites().has(slug));
  }, [slug]);

  function toggleFavorite() {
    const favorites = readFavorites();
    if (favorites.has(slug)) {
      favorites.delete(slug);
      setActive(false);
    } else {
      favorites.add(slug);
      setActive(true);
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites)));
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-pressed={active}
      aria-label={active ? "取消收藏" : "收藏提示词"}
      className={`inline-flex items-center justify-center rounded-lg border transition ${
        active
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-950"
      } ${compact ? "h-9 w-9 text-sm" : "gap-2 px-4 py-3 text-sm font-semibold"}`}
    >
      <span>{active ? "★" : "☆"}</span>
      {!compact && (
        <span>
          {active ? "已收藏" : "收藏"}
          {count != null && count > 0 && <span className="ml-1 text-xs opacity-70">{count}</span>}
        </span>
      )}
    </button>
  );
}
