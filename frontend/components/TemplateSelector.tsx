// frontend/components/TemplateSelector.tsx
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Template {
  id: string;
  name: string;
  platform: string;
  category: string;
  thumbnail_url: string | null;
}

interface Props {
  selected: string | null;
  onSelect: (id: string) => void;
  platform?: string;
}

export default function TemplateSelector({ selected, onSelect, platform }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    api.get("/templates/", { params: platform ? { platform } : {} })
      .then((r) => setTemplates(r.data))
      .catch(() => {});
  }, [platform]);

  if (templates.length === 0) {
    return <p className="text-sm text-gray-400">加载模板中...</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`border rounded-lg p-3 text-left text-sm transition ${
            selected === t.id
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-blue-300"
          }`}
        >
          <div className="font-medium truncate">{t.name}</div>
          <div className="text-gray-400 text-xs mt-1">{t.platform}</div>
        </button>
      ))}
    </div>
  );
}
