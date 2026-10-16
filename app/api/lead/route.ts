import { NextResponse } from "next/server";
import { createLead, DuplicateLeadError } from "@/lib/leads";
import { validateLead } from "@/lib/lead-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  try {
    const id = await createLead(
      validation.data,
      request.headers.get("referer")?.slice(0, 2048) ?? null,
    );

    return NextResponse.json(
      { data: { id, accepted: true, message: "Заявка принята." } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof DuplicateLeadError) {
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
