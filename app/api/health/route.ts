import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    getDatabase().prepare("SELECT 1").get();
    return NextResponse.json({ data: { status: "ok", database: "ok" } });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { error: { code: "DATABASE_UNAVAILABLE", message: "Хранилище заявок недоступно." } },
      { status: 503 },
    );
  }
}
