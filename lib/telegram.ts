import type { LeadInput } from "@/lib/lead-validation";

const interestLabels: Record<LeadInput["interest"], string> = {
  subscription: "Подписка на кофе",
  single_order: "Разовый заказ",
  question: "Вопрос",
};

type TelegramApiResponse = {
  ok?: unknown;
  error_code?: unknown;
};

function isTelegramApiResponse(value: unknown): value is TelegramApiResponse {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inlineValue(value: string | null): string {
  return value?.replace(/[\u0000-\u001f\u007f]+/g, " ").trim() || "—";
}

function createLeadMessage(id: number, lead: LeadInput): string {
  const lines = [
    `Новая заявка #${id}`,
    "",
    `Имя: ${inlineValue(lead.name)}`,
    `Телефон: ${inlineValue(lead.phone)}`,
    `Интерес: ${interestLabels[lead.interest]}`,
    `Комментарий: ${inlineValue(lead.comment)}`,
    "",
    "Источник:",
    `Страница: ${inlineValue(lead.page_url)}`,
    `Переход с: ${inlineValue(lead.referrer)}`,
    `UTM source: ${inlineValue(lead.utm_source)}`,
    `UTM medium: ${inlineValue(lead.utm_medium)}`,
    `UTM campaign: ${inlineValue(lead.utm_campaign)}`,
    `UTM content: ${inlineValue(lead.utm_content)}`,
    `UTM term: ${inlineValue(lead.utm_term)}`,
    `Google click ID: ${inlineValue(lead.gclid)}`,
  ];
  const message = lines.join("\n");
  const characters = Array.from(message);

  return characters.length <= 3900
    ? message
    : `${characters.slice(0, 3899).join("")}…`;
}

export async function sendLeadToTelegram(
  id: number,
  lead: LeadInput,
): Promise<"sent" | "not_configured"> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) return "not_configured";

  let response: Response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: createLeadMessage(id, lead),
        disable_web_page_preview: true,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("Telegram Bot API request timed out.");
    }
    throw new Error("Telegram Bot API request failed.");
  }

  if (!response.ok) {
    throw new Error(`Telegram Bot API returned HTTP ${response.status}.`);
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("Telegram Bot API returned an invalid response.");
  }

  if (!isTelegramApiResponse(result) || result.ok !== true) {
    const errorCode =
      isTelegramApiResponse(result) && typeof result.error_code === "number"
        ? ` (error ${result.error_code})`
        : "";
    throw new Error(`Telegram Bot API rejected the notification${errorCode}.`);
  }

  return "sent";
}
