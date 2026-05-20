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

const platformLabels: Record<string, string> = {
  taobao: "淘宝",
  pdd: "拼多多",
  douyin: "抖音小店",
  universal: "通用",
};

const categoryLabels: Record<string, string> = {
  scene: "场景",
  style: "风格",
  background: "背景",
};

export default function TemplateSelector({ selected, onSelect, platform }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api
      .get("/templates/", { params: platform ? { platform } : {} })
      .then((response) => setTemplates(response.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [platform]);

  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-500">
        正在加载模板...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        模板暂时无法加载，请确认后端服务已启动。
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-500">
        暂无可用模板。
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => {
        const active = selected === template.id;
        return (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className={`rounded-xl border p-4 text-left text-sm transition ${
              active
                ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-900/12"
                : "border-slate-200 bg-white text-slate-900 hover:border-slate-400 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-semibold">{template.name}</div>
                <div className={`mt-2 text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>
                  {platformLabels[template.platform] || template.platform}
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[11px] ${
                  active ? "bg-white/10 text-slate-200" : "bg-slate-100 text-slate-600"
                }`}
              >
                {categoryLabels[template.category] || template.category}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
