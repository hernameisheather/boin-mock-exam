// ============================================================
// Google Apps Script: 보인고 모의내신 - 저장 / 조회 / 목록
// ============================================================
// 이 코드는 Google Sheets > 확장 프로그램 > Apps Script 에 붙여넣기
// ============================================================

// ⚠️ 여기에 선생님 본인의 Gmail 주소 입력
const TEACHER_EMAIL = "YOUR_EMAIL@gmail.com";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || "save";

    if (action === "save") return handleSave(data);
    if (action === "lookup") return handleLookup(data);
    if (action === "listAll") return handleListAll();

    return jsonResponse({ error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ────────────────────────────────────────────────────────────
// 1) 답안 저장 + 이메일 알림
// ────────────────────────────────────────────────────────────
function handleSave(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // 헤더 없으면 생성
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "제출시각", "학번", "이름", "총점", "만점",
      "객관식점수", "객관식만점",
      "단답형점수", "단답형만점",
      "서술형점수", "서술형만점",
      "객관식_틀린문항", "단답형_틀린문항", "서술형_틀린문항",
      "학생답안(raw)"
    ]);
  }

  sheet.appendRow([
    data.submittedAt, data.studentId, data.studentName,
    data.totalScore, data.totalMax,
    data.mcScore, data.mcMax,
    data.shortScore, data.shortMax,
    data.essayScore, data.essayMax,
    data.wrongMc, data.wrongShort, data.wrongEssay,
    JSON.stringify(data.rawAnswers)
  ]);

  // 이메일 알림
  if (TEACHER_EMAIL && TEACHER_EMAIL !== "YOUR_EMAIL@gmail.com") {
    sendEmailNotification(data);
  }

  return jsonResponse({ success: true });
}

// ────────────────────────────────────────────────────────────
// 2) 학생 점수 조회 (학번+이름)
// ────────────────────────────────────────────────────────────
function handleLookup(data) {
  const { studentId, studentName } = data;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rows = sheet.getDataRange().getValues();

  // 헤더 제외, 뒤에서부터 검색 (최신 제출 찾기)
  for (let i = rows.length - 1; i >= 1; i--) {
    const r = rows[i];
    if (String(r[1]) === String(studentId) && String(r[2]).trim() === String(studentName).trim()) {
      const rawAnswers = r[14] ? JSON.parse(r[14]) : {};

      // 틀린 문항 파싱
      const wrongMcArr = r[11] && r[11] !== "없음"
        ? String(r[11]).split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n))
        : [];

      // wrongShort, wrongEssay는 라벨 문자열 → 키로 역변환 불필요 (그대로 사용)
      const wrongShortArr = r[12] && r[12] !== "없음"
        ? labelsToKeys(r[12])
        : [];
      const wrongEssayArr = r[13] && r[13] !== "없음"
        ? labelsToKeys(r[13])
        : [];

      // correct 배열 재구성
      const mcCorrect = [];
      for (let q = 1; q <= 36; q++) {
        if (!wrongMcArr.includes(q)) mcCorrect.push(q);
      }

      const record = {
        submittedAt: r[0],
        studentId: String(r[1]),
        studentName: r[2],
        totalScore: Number(r[3]),
        totalMax: Number(r[4]),
        mc: { score: Number(r[5]), max: Number(r[6]), wrong: wrongMcArr, correct: mcCorrect },
        short: { score: Number(r[7]), max: Number(r[8]), wrong: wrongShortArr, correct: [] },
        essay: { score: Number(r[9]), max: Number(r[10]), wrong: wrongEssayArr, correct: [] },
        rawAnswers: rawAnswers,
      };

      return jsonResponse({ found: true, record: record });
    }
  }

  return jsonResponse({ found: false });
}

// ────────────────────────────────────────────────────────────
// 3) 전체 목록 조회 (대시보드용)
// ────────────────────────────────────────────────────────────
function handleListAll() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rows = sheet.getDataRange().getValues();
  const records = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;  // 빈 행 skip

    records.push({
      submittedAt: r[0],
      studentId: String(r[1]),
      studentName: r[2],
      totalScore: Number(r[3]),
      totalMax: Number(r[4]),
      mcScore: Number(r[5]),
      mcMax: Number(r[6]),
      shortScore: Number(r[7]),
      shortMax: Number(r[8]),
      essayScore: Number(r[9]),
      essayMax: Number(r[10]),
      wrongMc: String(r[11] || ""),
      wrongShort: String(r[12] || ""),
      wrongEssay: String(r[13] || ""),
    });
  }

  return jsonResponse({ records: records });
}

// ────────────────────────────────────────────────────────────
// 유틸 함수
// ────────────────────────────────────────────────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function labelsToKeys(labelStr) {
  // 저장된 라벨 ("단답형1-(1), 서술형2-(1)" 등)을 키로 역변환
  const labelToKey = {
    "단답형1-(1)": "short1_1", "단답형1-(2)": "short1_2", "단답형1-(3)": "short1_3", "단답형1-(4)": "short1_4",
    "단답형2-(A)": "short2_A", "단답형2-(B)": "short2_B",
    "단답형3-(1)": "short3_1", "단답형3-(2)": "short3_2", "단답형3-(3)": "short3_3",
    "서술형1-(1)①": "essay1_1a", "서술형1-(1)②": "essay1_1b", "서술형1-(1)③": "essay1_1c", "서술형1-(2)": "essay1_2",
    "서술형2-(1)": "essay2_1", "서술형2-(2)": "essay2_2",
    "서술형3-(A)": "essay3_A", "서술형3-(B)": "essay3_B",
    "서술형4": "essay4",
  };
  return labelStr.split(",").map(l => labelToKey[l.trim()]).filter(k => k);
}

// ────────────────────────────────────────────────────────────
// 이메일 알림
// ────────────────────────────────────────────────────────────
function sendEmailNotification(data) {
  const subject = `[보인고 모의내신] ${data.studentName} (${data.studentId}) - ${data.totalScore}/${data.totalMax}점`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2 style="color: #2c3e50; border-bottom: 3px solid #2c3e50; padding-bottom: 8px;">
        📝 보인고 2차 모의내신 제출
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 10px; background: #f3f4f6; width: 120px;"><b>학생</b></td>
          <td style="padding: 10px;">${data.studentName} (${data.studentId})</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f3f4f6;"><b>제출 시각</b></td>
          <td style="padding: 10px;">${data.submittedAt}</td>
        </tr>
      </table>
      <div style="background: #2c3e50; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <div style="font-size: 14px; opacity: 0.9;">총점</div>
        <div style="font-size: 36px; font-weight: bold; margin: 4px 0;">
          ${data.totalScore} / ${data.totalMax}점
        </div>
      </div>
      <h3 style="color: #2c3e50;">영역별 점수</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #f9fafb;">
          <td style="padding: 10px; border: 1px solid #e5e7eb;"><b>객관식</b></td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">${data.mcScore} / ${data.mcMax}점</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb;"><b>단답형</b></td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">${data.shortScore} / ${data.shortMax}점</td>
        </tr>
        <tr style="background: #f9fafb;">
          <td style="padding: 10px; border: 1px solid #e5e7eb;"><b>서술형</b></td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">${data.essayScore} / ${data.essayMax}점</td>
        </tr>
      </table>
      <h3 style="color: #c0392b;">틀린 문항</h3>
      <div style="padding: 12px; background: #fef2f2; border-left: 4px solid #c0392b; border-radius: 4px;">
        <div style="margin-bottom: 8px;"><b>객관식:</b> ${data.wrongMc}</div>
        <div style="margin-bottom: 8px;"><b>단답형:</b> ${data.wrongShort}</div>
        <div><b>서술형:</b> ${data.wrongEssay}</div>
      </div>
    </div>
  `;

  GmailApp.sendEmail(TEACHER_EMAIL, subject, "", {
    htmlBody: htmlBody,
    name: "보인고 모의내신 시스템"
  });
}

// ────────────────────────────────────────────────────────────
// 테스트 함수 (선택)
// ────────────────────────────────────────────────────────────
function testSave() {
  const testData = { postData: { contents: JSON.stringify({
    action: "save",
    submittedAt: new Date().toLocaleString("ko-KR"),
    studentId: "10101", studentName: "테스트학생",
    totalScore: 85, totalMax: 100,
    mcScore: 60, mcMax: 66, shortScore: 10, shortMax: 14, essayScore: 15, essayMax: 20,
    wrongMc: "3,7,15", wrongShort: "단답형1-(2)", wrongEssay: "서술형2-(2)",
    rawAnswers: { mc: {}, short: {}, essay: {} }
  })}};
  doPost(testData);
}
