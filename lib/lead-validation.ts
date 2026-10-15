export const interests = ["subscription", "single_order", "question"] as const;

export type LeadInterest = (typeof interests)[number];

export type LeadInput = {
  name: string;
  phone: string;
  interest: LeadInterest;
  comment: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  gclid: string | null;
  page_url: string | null;
  referrer: string | null;
};

export type ValidationResult =
  | { success: true; data: LeadInput }
  | { success: false; errors: Record<string, string> };

type OptionalLeadFields = Pick<
  LeadInput,
  "comment" | "utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term" | "gclid"
> & { pageUrl: string | null };

function isLeadInterest(value: unknown): value is LeadInterest {
  return typeof value === "string" && interests.some((interest) => interest === value);
}

function optionalText(
  value: unknown,
  field: string,
  errors: Record<string, string>,
  maximumLength: number,
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    errors[field] = "Поле должно быть строкой.";
    return null;
  }

  const text = value.trim();
  if (text.length > maximumLength) {
    errors[field] = `Максимальная длина — ${maximumLength} символов.`;
    return null;
  }

  return text || null;
}

function normalizeBelarusianPhone(value: string): string | null {
  if (!/^[+\d\s()-]+$/.test(value)) return null;

  const digits = value.replace(/\D/g, "");
  if (value.trimStart().startsWith("+")) {
    return /^375\d{9}$/.test(digits) ? `+${digits}` : null;
  }
  if (/^375\d{9}$/.test(digits)) return `+${digits}`;
  if (/^80\d{9}$/.test(digits)) return `+375${digits.slice(2)}`;
  if (/^\d{9}$/.test(digits)) return `+375${digits}`;

  return null;
}

export function validateLead(value: unknown): ValidationResult {
  const errors: Record<string, string> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { success: false, errors: { body: "Ожидается JSON-объект." } };
  }

  const body = value as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 100) {
    errors.name = "Укажите имя длиной от 2 до 100 символов.";
  }

  const phone =
    typeof body.phone === "string"
      ? normalizeBelarusianPhone(body.phone.trim())
      : null;
  if (!phone) {
    errors.phone = "Введите белорусский номер, например +375 29 123-45-67.";
  }

  const interest = isLeadInterest(body.interest) ? body.interest : null;
  if (!interest) {
    errors.interest = "Выберите subscription, single_order или question.";
  }

  const optionalValues: OptionalLeadFields = {
    comment: optionalText(body.comment, "comment", errors, 1000),
    utm_source: optionalText(body.utm_source, "utm_source", errors, 200),
    utm_medium: optionalText(body.utm_medium, "utm_medium", errors, 200),
    utm_campaign: optionalText(body.utm_campaign, "utm_campaign", errors, 200),
    utm_content: optionalText(body.utm_content, "utm_content", errors, 200),
    utm_term: optionalText(body.utm_term, "utm_term", errors, 200),
    gclid: optionalText(body.gclid, "gclid", errors, 500),
    pageUrl: optionalText(body.pageUrl, "pageUrl", errors, 2048),
  };

  if (optionalValues.pageUrl) {
    try {
      const url = new URL(optionalValues.pageUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        errors.pageUrl = "Укажите URL страницы с протоколом http или https.";
      }
    } catch {
      errors.pageUrl = "Укажите полный URL страницы.";
    }
  }

  if (Object.keys(errors).length || !phone || !interest) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name,
      phone,
      interest,
      comment: optionalValues.comment,
      utm_source: optionalValues.utm_source,
      utm_medium: optionalValues.utm_medium,
      utm_campaign: optionalValues.utm_campaign,
      utm_content: optionalValues.utm_content,
      utm_term: optionalValues.utm_term,
      gclid: optionalValues.gclid,
      page_url: optionalValues.pageUrl,
      referrer: null,
    },
  };
}
