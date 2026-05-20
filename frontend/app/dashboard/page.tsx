// frontend/app/dashboard/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import TemplateSelector from "@/components/TemplateSelector";
import CreditEstimate from "@/components/CreditEstimate";
import ImageResult from "@/components/ImageResult";
import toast from "react-hot-toast";

type Mode = "template" | "keyword" | "custom";

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
    if (!token) router.push("/login");
  }, [token, router]);

  useEffect(() => {
    api
      .post("/generate/estimate", { mode, has_reference_image: !!referenceFile })
      .then((r) => setCreditsRequired(r.data.credits_required))
      .catch(() => {});
  }, [mode, referenceFile]);

  const handleGenerate = useCallback(async () => {
    if (creditBalance < creditsRequired) {
      toast.error("积分不足，请前往充值");
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
        if (!keywords.trim()) { toast.error("请输入关键词"); return; }
        form.append("keywords", keywords);
        endpoint = "/generate/keyword";
      } else if (mode === "template") {
        if (!selectedTemplate) { toast.error("请选择模板"); return; }
        if (!productDesc.trim()) { toast.error("请输入商品描述"); return; }
        form.append("product_description", productDesc);
        endpoint = `/generate/template/${selectedTemplate}`;
      } else {
        if (!customPrompt.trim()) { toast.error("请输入 Prompt"); return; }
        form.append("prompt", customPrompt);
        endpoint = "/generate/custom";
      }

      const { data } = await api.post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultUrl(data.image_url);
      updateBalance(data.credits_remaining);
      toast.success("生成成功！");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "生成失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [mode, keywords, selectedTemplate, productDesc, customPrompt, referenceFile, creditBalance, creditsRequired, router, updateBalance]);

  const modeLabels: Record<Mode, string> = {
    template: "场景模板",
    keyword: "关键词",
    custom: "自定义 Prompt",
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI 商品图生成</h1>
        <div className="text-sm text-gray-500">
          积分余额：<strong className="text-blue-600">{creditBalance}</strong> 张
          <a href="/credits" className="ml-2 text-blue-500 underline text-xs">充值</a>
          <a href="/history" className="ml-2 text-gray-400 underline text-xs">历史</a>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6">
        {(["template", "keyword", "custom"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResultUrl(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              mode === m
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {/* Mode content */}
      {mode === "template" && (
        <div className="space-y-4">
          <TemplateSelector
            selected={selectedTemplate}
            onSelect={setSelectedTemplate}
          />
          <input
            placeholder="商品描述（如：蓝色真丝连衣裙）"
            value={productDesc}
            onChange={(e) => setProductDesc(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
      {mode === "keyword" && (
        <input
          placeholder="输入中文关键词，如：蓝色 简约 女装连衣裙 春季"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
      {mode === "custom" && (
        <textarea
          placeholder="输入英文 Prompt..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          rows={4}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}

      {/* Reference image */}
      <div className="mt-4">
        <label className="text-sm text-gray-600 block mb-1">
          上传商品参考图（可选，消耗积分 +1）
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setReferenceFile(e.target.files?.[0] || null)}
          className="text-sm"
        />
      </div>

      {/* Credit estimate */}
      <div className="mt-4">
        <CreditEstimate
          creditsRequired={creditsRequired}
          creditsBalance={creditBalance}
        />
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || creditBalance < creditsRequired}
        className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 text-sm"
      >
        {loading ? "生成中，约需 15-30 秒..." : "立即生成"}
      </button>

      {resultUrl && (
        <ImageResult imageUrl={resultUrl} onReset={() => setResultUrl(null)} />
      )}
    </main>
  );
}
