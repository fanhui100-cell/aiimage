"use server";

import { createClient } from "@/lib/supabase/server";

export type ConsultFormData = {
  businessType: string;
  websiteStatus: string;
  targetMarkets: string[];
  packageInterest: string;
  productCount: string;
  timeline: string;
  budget: string;
  name: string;
  company: string;
  contact: string;
  notes: string;
  locale: string;
};

export type ConsultFormState = {
  success?: boolean;
  error?: string;
};

export async function submitConsultForm(
  data: ConsultFormData
): Promise<ConsultFormState> {
  if (!data.name || !data.contact) {
    return { error: "请填写姓名和联系方式" };
  }

  const messageParts = [
    "[需求咨询表单]",
    `业务类型: ${data.businessType}`,
    `网站现状: ${data.websiteStatus}`,
    `目标市场: ${data.targetMarkets.join("、")}`,
    `感兴趣套餐: ${data.packageInterest}`,
    `产品数量: ${data.productCount}`,
    `上线时间: ${data.timeline}`,
    `预算范围: ${data.budget}`,
  ];
  if (data.notes) messageParts.push(`\n补充说明:\n${data.notes}`);
  const message = messageParts.join("\n");

  try {
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from("contact_submissions")
      .insert({
        name: data.name,
        company: data.company || null,
        contact: data.contact,
        message,
        locale: `consult-${data.locale}`,
      });
    if (dbError) throw dbError;

    // Optional email notification — skipped gracefully if env vars are missing
    if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const from =
          process.env.RESEND_FROM ?? "Consult Form <noreply@resend.dev>";
        await resend.emails.send({
          from,
          to: [process.env.NOTIFY_EMAIL],
          subject: `新需求咨询 — ${data.name}${data.company ? ` (${data.company})` : ""}`,
          html: `<pre style="font-family:sans-serif;white-space:pre-wrap;font-size:14px">${message}\n\n联系方式: ${data.contact}</pre>`,
        });
      } catch {
        // Email failure does not break form submission
      }
    }

    return { success: true };
  } catch {
    return { error: "提交失败，请稍后重试" };
  }
}
