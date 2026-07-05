"use server";

import { createClient } from "@/lib/supabase/server";

export type ContactFormState = {
  success?: boolean;
  error?: string;
};

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const company = (formData.get("company") as string | null)?.trim() ?? "";
  const contact = (formData.get("contact") as string | null)?.trim() ?? "";
  const message = (formData.get("message") as string | null)?.trim() ?? "";
  const locale = (formData.get("locale") as string | null) ?? "zh";

  if (!name || !contact || !message) {
    return { error: "请填写所有必填项" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_submissions").insert({
    name,
    company: company || null,
    contact,
    message,
    locale,
  });

  if (error) {
    console.error("Contact form insert error:", error.message);
    return { error: "提交失败，请稍后重试" };
  }

  return { success: true };
}
