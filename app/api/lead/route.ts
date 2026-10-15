import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { validateLead, type LeadInput } from "@/lib/lead-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const duplicateWindowMs = 10 * 60 * 1000;

function saveLead(lead: LeadInput): boolean {
  const database = getDatabase();
  const insertLead = database.prepare(`
    INSERT INTO leads (
      name, phone, interest, comment, utm_source, utm_medium, utm_campaign,
      utm_content, utm_term, gclid, page_url, referrer, created_at
    ) VALUES (
      @name, @phone, @interest, @comment, @utm_source, @utm_medium, @utm_campaign,
      @utm_content, @utm_term, @gclid, @page_url, @referrer, @created_at
    )
  `);

  const findRecentLead = database.prepare(`
    SELECT id
    FROM leads
    WHERE phone = ? AND created_at > ?
    LIMIT 1
  `);

  return database.transaction(
    () => {
      const now = Date.now();
      const recentLead = findRecentLead.get(lead.phone, now - duplicateWindowMs);
      if (recentLead) return false;

      insertLead.run({
        ...lead,
        created_at: now,
      });
      return true;
    },
  ).immediate();
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json(
      { error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Отправьте данные в формате JSON." } },
      { status: 415 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Не удалось прочитать JSON. Проверьте тело запроса." } },
      { status: 400 },
    );
  }

  const validation = validateLead(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Проверьте заполненные поля.",
          fields: validation.errors,
        },
      },
      { status: 422 },
    );
  }

  const lead = {
    ...validation.data,
    referrer: request.headers.get("referer")?.slice(0, 2048) ?? null,
  };

  try {
    const created = saveLead(lead);
    if (!created) {
      return NextResponse.json(
        {
          error: {
            code: "DUPLICATE_LEAD",
            message: "Заявка с этим номером уже отправлена. Попробуйте ещё раз через 10 минут.",
          },
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { data: { accepted: true, message: "Заявка принята." } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to save lead:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Не удалось сохранить заявку. Попробуйте позже или позвоните нам.",
        },
      },
      { status: 500 },
    );
  }
}
