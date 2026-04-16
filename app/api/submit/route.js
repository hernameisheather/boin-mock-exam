import { NextResponse } from "next/server";
import { gradeSubmission, QUESTION_LABELS } from "../../../lib/answerKey";

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, studentName, mc, short, essay } = body;

    if (!studentId || !studentName) {
      return NextResponse.json({ error: "학번과 이름이 필요합니다." }, { status: 400 });
    }

    const graded = gradeSubmission({ mc, short, essay });

    const submittedAt = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    const wrongMcStr = graded.mc.wrong.length > 0 ? graded.mc.wrong.join(",") : "없음";
    const wrongShortStr = graded.short.wrong.length > 0 ? graded.short.wrong.map(k => QUESTION_LABELS[k] || k).join(",") : "없음";
    const wrongEssayStr = graded.essay.wrong.length > 0 ? graded.essay.wrong.map(k => QUESTION_LABELS[k] || k).join(",") : "없음";

    const payload = {
      submittedAt, studentId, studentName,
      totalScore: graded.totalScore,
      totalMax: graded.totalMax,
      mcScore: graded.mc.score, mcMax: graded.mc.max,
      shortScore: graded.short.score, shortMax: graded.short.max,
      essayScore: graded.essay.score, essayMax: graded.essay.max,
      wrongMc: wrongMcStr, wrongShort: wrongShortStr, wrongEssay: wrongEssayStr,
      rawAnswers: { mc, short, essay },
    };

    // Google Sheets 저장
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
    if (GOOGLE_SCRIPT_URL) {
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save", ...payload }),
        });
      } catch (e) { console.error("Sheets 저장 실패:", e); }
    }

    // Telegram
    const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TG_CHAT = process.env.TELEGRAM_CHAT_ID;
    if (TG_TOKEN && TG_CHAT) {
      const message = [
        `📝 *보인고 2차 모의내신 제출*`, ``,
        `👤 ${studentName} (${studentId})`,
        `🕐 ${submittedAt}`, ``,
        `🏆 총점: *${graded.totalScore} / ${graded.totalMax}점*`,
        `  ├ 객관식: ${graded.mc.score} / ${graded.mc.max}`,
        `  ├ 단답형: ${graded.short.score} / ${graded.short.max}`,
        `  └ 서술형: ${graded.essay.score} / ${graded.essay.max}`, ``,
        `❌ 틀린 문항:`,
        `  • 객관식: ${wrongMcStr}`,
        `  • 단답형: ${wrongShortStr}`,
        `  • 서술형: ${wrongEssayStr}`,
      ].join("\n");

      try {
        await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TG_CHAT, text: message, parse_mode: "Markdown",
          }),
        });
      } catch (e) { console.error("Telegram 전송 실패:", e); }
    }

    // 학생에게 반환 (rawAnswers 포함 → PDF에서 학생 답안 표시 가능)
    return NextResponse.json({
      studentId, studentName, submittedAt,
      mc: graded.mc, short: graded.short, essay: graded.essay,
      totalScore: graded.totalScore, totalMax: graded.totalMax,
      rawAnswers: { mc, short, essay },
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류: " + e.message }, { status: 500 });
  }
}
