"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { PromptItem } from "@/lib/prompts";

function replaceVariable(template: string, name: string, value: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return template.replace(new RegExp(`\\{${escaped}\\}`, "g"), value || `{${name}}`);
}

export default function PromptVariableBuilder({ prompt }: { prompt: PromptItem }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState<"zh" | "en">("zh");

  const compiledPrompt = useMemo(() => {
    const source = language === "zh" ? prompt.promptZh : prompt.promptEn;
    return prompt.variables.reduce((result, variable) => replaceVariable(result, variable, values[variable] || ""), source);
  }, [language, prompt.promptEn, prompt.promptZh, prompt.variables, values]);

  async function copyPrompt() {
    await navigator.clipboard.writeText(compiledPrompt);
    toast.success("已复制优化后的提示词");
  }

  const dashboardHref = `/dashboard?text=${encodeURIComponent(compiledPrompt)}`;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Prompt Builder</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">填写变量，生成可直接使用的提示词</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            同类提示词网站通常只给一段文本，这里把变量拆出来，用户复制前就能完成本地化替换。
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
          {(["zh", "en"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setLanguage(item)}
              className={`rounded-md px-3 py-2 font-semibold ${language === item ? "bg-slate-950 text-white" : "text-slate-500"}`}
            >
              {item === "zh" ? "中文" : "English"}
            </button>
          ))}
        </div>
      </div>

      {prompt.variables.length > 0 && (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {prompt.variables.map((variable) => (
            <label key={variable} className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">{variable}</span>
              <input
                value={values[variable] || ""}
                onChange={(event) => setValues((current) => ({ ...current, [variable]: event.target.value }))}
                placeholder={`输入${variable}`}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-900/10"
              />
            </label>
          ))}
        </div>
      )}

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Live Preview</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">{prompt.model}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{compiledPrompt}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          onClick={copyPrompt}
          className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          复制优化后的提示词
        </button>
        <Link
          href={dashboardHref}
          className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-400"
        >
          带入生成台
        </Link>
      </div>
    </section>
  );
}
