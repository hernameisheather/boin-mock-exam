import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { password } = await request.json();

    const expectedPw = process.env.DASHBOARD_PASSWORD;
    if (!expectedPw) {
      return NextResponse.json({ error: "대시보드 비밀번호가 설정되지 않았습니다." }, { status: 500 });
    }

    if (password !== expectedPw) {
      return NextResponse.json({ error: "비밀번호가 일치하지 않습니다." }, { status: 401 });
    }

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
    if (!GOOGLE_SCRIPT_URL) {
      return NextResponse.json({ error: "Google Sheets 연결이 설정되지 않았습니다." }, { status: 500 });
    }

    // Google Apps Script에서 전체 데이터 가져오기
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "listAll" }),
    });

    const data = await res.json();
    return NextResponse.json({ records: data.records || [] });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "조회 중 오류: " + e.message }, { status: 500 });
  }
}
