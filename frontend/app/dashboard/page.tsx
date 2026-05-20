"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import CreditEstimate from "@/components/CreditEstimate";
import ImageResult from "@/components/ImageResult";
import TemplateSelector from "@/components/TemplateSelector";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getPromptBySlug } from "@/lib/prompts";

type Mode = "template" | "keyword" | "custom";

const modeLabels: Record<Mode, { title: string; desc: string }> = {
  template: { title: "场景模板", desc: "新手首选，选择平台和风格即可生成" },
  keyword: { title: "关键词", desc: "输入中文卖点，系统自动扩写提示词" },
  custom: { title: "自定义 Prompt", desc: "适合高级用户精细控制画面" },
};

export default function Dashboard() {
  const { token, creditBalance, updateBalance } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [keywords, setKeywords] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [creditsRequired, setCreditsRequired] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("prompt");
    if (!slug) return;
    const prompt = getPromptBySlug(slug);
    if (!prompt) return;
    setMode("custom");
    setCustomPrompt(prompt.promptZh);
    toast.success(`已载入提示词：${prompt.title}`);
  }, []);

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    api
      .get("/credits/balance")
      .then((response) => updateBalance(response.data.credit_balance))
      .catch(() => {});
  }, [token, updateBalance]);

  useEffect(() => {
    if (!token) return;
    api
      .post("/generate/estimate", { mode, has_reference_image: !!referenceFile })
      .then((response) => setCreditsRequired(response.data.credits_required))
      .catch(() => setCreditsRequired(referenceFile ? 2 : 1));
  }, [mode, referenceFile, token]);

  const handleGenerate = useCallback(async () => {
    if (creditBalance < creditsRequired) {
      toast.error("积分不足，请先充值");
      router.push("/credits");
      return;
    }

    setLoading(true);
    setResultUrl(null);

    try {
      const form = new FormData();
      if (referenceFile) form.append("reference_image", referenceFile);

      let endpoint = "";
      if (mode === "keyword") {
        if (!keywords.trim()) {
          toast.error("请输入关键词");
          return;
        }
        form.append("keywords", keywords.trim());
        endpoint = "/generate/keyword";
      } else if (mode === "template") {
        if (!selectedTemplate) {
          toast.error("请选择模板");
          return;
        }
        if (!productDesc.trim()) {
          toast.error("请输入商品描述");
          return;
        }
        form.append("product_description", productDesc.trim());
        endpoint = `/generate/template/${selectedTemplate}`;
      } else {
        if (!customPrompt.trim()) {
          toast.error("请输入 Prompt");
          return;
        }
        form.append("prompt", customPrompt.trim());
        endpoint = "/generate/custom";
      }

      const { data } = await api.post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultUrl(data.image_url);
      updateBalance(data.credits_remaining);
      toast.success("生成成功");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [
    mode,
    keywords,
    selectedTemplate,
    productDesc,
    customPrompt,
    referenceFile,
    creditBalance,
    creditsRequired,
    router,
    updateBalance,
  ]);

  return (
    <main className="min-h-screen">
      <header className="border-b border-white/70 bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
              图
            </span>
            <span className="text-sm font-semibold text-slate-950">Prompt123</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/history" className="hidden text-slate-500 hover:text-slate-950 sm:inline">
              历史记录
            </Link>
            <Link
              href="/credits"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 hover:border-slate-400"
            >
              余额 {creditBalance} 张
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-amber-700">AI 商品图生成台</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              选择生成方式，快速产出可测试主图。
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              建议先用模板模式生成稳定结果，再用关键词或自定义 Prompt 微调风格。上架前请自行核对商品、文案与合规风险。
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">当前账户</span>
              <span className="font-semibold text-slate-950">{creditBalance} 张积分</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-700"
                style={{ width: `${Math.min(100, Math.max(8, creditBalance * 8))}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-900/5">
            <div className="grid gap-3 md:grid-cols-3">
              {(["template", "keyword", "custom"] as Mode[]).map((item) => {
                const active = mode === item;
                return (
                  <button
                    key={item}
                    onClick={() => {
                      setMode(item);
                      setResultUrl(null);
                    }}
                    className={`rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
                    }`}
                  >
                    <div className="font-semibold">{modeLabels[item].title}</div>
                    <div className={`mt-2 text-xs leading-5 ${active ? "text-slate-300" : "text-slate-500"}`}>
                      {modeLabels[item].desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-5">
              {mode === "template" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">选择场景模板</label>
                    <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-900">商品描述</span>
                    <input
                      placeholder="例如：蓝色真丝连衣裙，春夏通勤，轻奢质感"
                      value={productDesc}
                      onChange={(event) => setProductDesc(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-900/10"
                    />
                  </label>
                </>
              )}

              {mode === "keyword" && (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-900">中文关键词</span>
                  <textarea
                    placeholder="例如：蓝色、简约、女装连衣裙、春季、通勤、清爽背景"
                    value={keywords}
                    onChange={(event) => setKeywords(event.target.value)}
                    rows={5}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-900/10"
                  />
                </label>
              )}

              {mode === "custom" && (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-900">自定义 Prompt</span>
                  <textarea
                    placeholder="输入你希望模型执行的完整图像生成提示词..."
                    value={customPrompt}
                    onChange={(event) => setCustomPrompt(event.target.value)}
                    rows={7}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-900/10"
                  />
                </label>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-900/5">
              <h2 className="text-base font-semibold text-slate-950">商品参考图</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                上传商品图可提升一致性，预计额外消耗 1 张积分。
              </p>
              <label className="mt-4 block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500 transition hover:border-slate-500">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setReferenceFile(event.target.files?.[0] || null)}
                  className="sr-only"
                />
                {referenceFile ? referenceFile.name : "点击上传商品图"}
              </label>
            </section>

            <CreditEstimate creditsRequired={creditsRequired} creditsBalance={creditBalance} />

            <button
              onClick={handleGenerate}
              disabled={loading || creditBalance < creditsRequired}
              className="w-full rounded-lg bg-amber-700 px-5 py-4 text-sm font-semibold text-white shadow-xl shadow-amber-900/15 transition hover:-translate-y-0.5 hover:bg-amber-800 disabled:translate-y-0 disabled:opacity-50"
            >
              {loading ? "生成中，约需 15-30 秒..." : "立即生成"}
            </button>

            <div className="rounded-xl border border-slate-200 bg-white/75 p-4 text-xs leading-5 text-slate-500">
              成本提示：AI 生成结果具有随机性。若需要用于正式上架，请重点检查商品主体、文字、价格、品牌标识和平台规则。
            </div>
          </aside>
        </div>

        {resultUrl && <ImageResult imageUrl={resultUrl} onReset={() => setResultUrl(null)} />}
      </section>
    </main>
  );
}
