import type { PromptItem } from "@/lib/prompts";

export default function PromptJsonLd({ prompt }: { prompt: PromptItem }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: prompt.title,
    description: prompt.summary,
    step: [
      { "@type": "HowToStep", text: `选择模型：${prompt.model}` },
      { "@type": "HowToStep", text: `使用提示词：${prompt.promptZh.slice(0, 200)}` },
    ],
    tool: [{ "@type": "HowToTool", name: prompt.platform }],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
