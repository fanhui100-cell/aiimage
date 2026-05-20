"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth";

const STORAGE_KEY = "prompt123:favorites";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function readLocalFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeLocalFavorites(favorites: Set<string>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites)));
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
  const { token } = useAuth();
  const [active, setActive] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (!token) {
      setActive(readLocalFavorites().has(slug));
    } else {
      setActive(initialFavorited);
    }
  }, [slug, token, initialFavorited]);

  async function toggleFavorite() {
    if (token) {
      try {
        const res = await fetch(`${API_BASE}/api/prompts/${slug}/favorite`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json() as { favorited: boolean; favorite_count: number };
        setActive(data.favorited);
        setCount(data.favorite_count);
        toast.success(data.favorited ? "已收藏" : "已取消收藏");
      } catch {
        toast.error("操作失败，请重试");
      }
    } else {
      const favorites = readLocalFavorites();
      if (favorites.has(slug)) {
        favorites.delete(slug);
        setActive(false);
        toast.success("已取消收藏");
      } else {
        favorites.add(slug);
        setActive(true);
        toast.success("已收藏（登录后可同步到云端）");
      }
      writeLocalFavorites(favorites);
    }
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
