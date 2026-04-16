import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { studentId, studentName } = await request.json();

    if (!studentId || !studentName) {
      return NextResponse.json({ error: "학번과 이름이 필요합니다." }, { status: 400 });
    }

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
    if (!GOOGLE_SCRIPT_URL) {
      return NextResponse.json({ error: "시스템 오류: 조회 서비스가 설정되지 않았습니다." }, { status: 500 });
    }

    // Google Apps Script에 조회 요청
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "lookup",
        studentId,
        studentName,
      }),
    });

    const data = await res.json();

    if (!data.found) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      ...data.record,
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "조회 중 오류 발생: " + e.message }, { status: 500 });
  }
}
