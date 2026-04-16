// ============================================================
// PDF 리포트 생성 (한글 지원)
// ============================================================

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { QUESTION_LABELS } from "./answerKey";

// ─── 한글 폰트 로드 (Noto Sans KR) ───
// Google Fonts의 Noto Sans KR을 CDN에서 가져와서 PDF에 임베드
let fontLoaded = false;
let fontData = null;

async function loadKoreanFont() {
  if (fontLoaded) return fontData;

  try {
    // Noto Sans KR 폰트 (Google Fonts)
    // base64로 인코딩된 폰트 파일을 CDN에서 다운로드
    const fontUrl = "https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.2/NanumSquareRoundR.woff";

    // 실제로는 이미 base64 인코딩된 한글 폰트를 써야 하므로
    // 아래 방식으로 TTF 파일을 직접 가져옵니다
    const response = await fetch("https://cdn.jsdelivr.net/npm/noto-sans-kr@0.0.1/NotoSansKR-Regular.otf");
    if (!response.ok) throw new Error("폰트 로드 실패");

    const buffer = await response.arrayBuffer();

    // ArrayBuffer → base64 변환
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    fontData = btoa(binary);
    fontLoaded = true;
    return fontData;
  } catch (e) {
    console.warn("한글 폰트 로드 실패, 영문으로 대체:", e);
    return null;
  }
}

export async function generatePdfReport(result) {
  const {
    studentName, studentId, submittedAt,
    mc, short, essay, totalScore, totalMax,
    rawAnswers
  } = result;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // 한글 폰트 로드 및 등록
  const koreanFont = await loadKoreanFont();
  let fontName = "helvetica"; // 기본값

  if (koreanFont) {
    try {
      doc.addFileToVFS("NotoSansKR.ttf", koreanFont);
      doc.addFont("NotoSansKR.ttf", "NotoSansKR", "normal");
      doc.addFont("NotoSansKR.ttf", "NotoSansKR", "bold");
      fontName = "NotoSansKR";
    } catch (e) {
      console.warn("폰트 등록 실패:", e);
    }
  }

  doc.setFont(fontName, "normal");

  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;

  // ─── 헤더 ───
  doc.setFillColor(44, 62, 80);
  doc.rect(0, 0, pageW, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(fontName, "bold");
  doc.text("보인고 2차 모의내신 성적표", pageW / 2, 12, { align: "center" });

  doc.setFontSize(11);
  doc.setFont(fontName, "normal");
  doc.text(`${studentName} (학번: ${studentId})`, pageW / 2, 20, { align: "center" });
  doc.text(`제출일시: ${submittedAt}`, pageW / 2, 26, { align: "center" });

  doc.setTextColor(0, 0, 0);
  y = 40;

  // ─── 총점 박스 ───
  doc.setFillColor(236, 240, 241);
  doc.roundedRect(15, y, pageW - 30, 25, 3, 3, "F");
  doc.setFontSize(10);
  doc.setFont(fontName, "normal");
  doc.text("총점", pageW / 2, y + 7, { align: "center" });
  doc.setFontSize(24);
  doc.setFont(fontName, "bold");
  doc.setTextColor(44, 62, 80);
  doc.text(`${totalScore} / ${totalMax}점`, pageW / 2, y + 18, { align: "center" });
  doc.setTextColor(0, 0, 0);
  y += 32;

  // ─── 영역별 점수 ───
  doc.setFontSize(12);
  doc.setFont(fontName, "bold");
  doc.text("영역별 점수", 15, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["영역", "점수", "만점", "정답"]],
    body: [
      ["객관식", mc.score, mc.max, `${mc.correct.length} / 36`],
      ["단답형", short.score, short.max, `${short.correct.length} / 9`],
      ["서술형", essay.score, essay.max, `${essay.correct.length} / 10`],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: 255,
      fontStyle: "bold",
      font: fontName,
    },
    bodyStyles: { fontSize: 10, font: fontName },
    margin: { left: 15, right: 15 },
  });
  y = doc.lastAutoTable.finalY + 8;

  // ─── 객관식 상세 ───
  doc.setFontSize(12);
  doc.setFont(fontName, "bold");
  doc.text("객관식 상세 (36문항)", 15, y);
  y += 4;

  const mcBody = [];
  for (let row = 0; row < 6; row++) {
    const r = [];
    for (let col = 0; col < 6; col++) {
      const q = row * 6 + col + 1;
      const studentAns = rawAnswers?.mc?.[q] || "-";
      const isCorrect = mc.correct.includes(q);
      r.push(`${q}. ${isCorrect ? "O" : "X"}  (${studentAns})`);
    }
    mcBody.push(r);
  }

  autoTable(doc, {
    startY: y,
    body: mcBody,
    theme: "grid",
    bodyStyles: { fontSize: 8, halign: "center", font: fontName },
    margin: { left: 15, right: 15 },
    didParseCell: function(data) {
      const txt = data.cell.raw;
      if (typeof txt === "string" && txt.includes("X")) {
        data.cell.styles.textColor = [192, 57, 43];
        data.cell.styles.fontStyle = "bold";
      } else if (typeof txt === "string" && txt.includes("O")) {
        data.cell.styles.textColor = [39, 174, 96];
      }
    }
  });
  y = doc.lastAutoTable.finalY + 8;

  // ─── 단답형 상세 ───
  doc.setFontSize(12);
  doc.setFont(fontName, "bold");
  if (y > 240) { doc.addPage(); y = 20; }
  doc.text("단답형 상세", 15, y);
  y += 4;

  const shortBody = Object.keys(QUESTION_LABELS)
    .filter(k => k.startsWith("short"))
    .map(k => {
      const answer = rawAnswers?.short?.[k] || "(미작성)";
      const isCorrect = short.correct.includes(k);
      return [QUESTION_LABELS[k], answer, isCorrect ? "O" : "X"];
    });

  autoTable(doc, {
    startY: y,
    head: [["문항", "학생 답안", "정오"]],
    body: shortBody,
    theme: "grid",
    headStyles: { fillColor: [44, 62, 80], textColor: 255, font: fontName },
    bodyStyles: { fontSize: 9, font: fontName },
    columnStyles: { 0: { cellWidth: 30 }, 2: { cellWidth: 20, halign: "center" } },
    margin: { left: 15, right: 15 },
    didParseCell: function(data) {
      if (data.column.index === 2 && data.section === "body") {
        const txt = data.cell.raw;
        if (txt === "X") {
          data.cell.styles.textColor = [192, 57, 43];
          data.cell.styles.fontStyle = "bold";
        } else if (txt === "O") {
          data.cell.styles.textColor = [39, 174, 96];
          data.cell.styles.fontStyle = "bold";
        }
      }
    }
  });
  y = doc.lastAutoTable.finalY + 8;

  // ─── 서술형 상세 ───
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont(fontName, "bold");
  doc.text("서술형 상세", 15, y);
  y += 4;

  const essayBody = Object.keys(QUESTION_LABELS)
    .filter(k => k.startsWith("essay"))
    .map(k => {
      const answer = rawAnswers?.essay?.[k] || "(미작성)";
      const isCorrect = essay.correct.includes(k);
      return [QUESTION_LABELS[k], answer, isCorrect ? "O" : "X"];
    });

  autoTable(doc, {
    startY: y,
    head: [["문항", "학생 답안", "정오"]],
    body: essayBody,
    theme: "grid",
    headStyles: { fillColor: [44, 62, 80], textColor: 255, font: fontName },
    bodyStyles: { fontSize: 9, font: fontName },
    columnStyles: { 0: { cellWidth: 30 }, 2: { cellWidth: 20, halign: "center" } },
    margin: { left: 15, right: 15 },
    didParseCell: function(data) {
      if (data.column.index === 2 && data.section === "body") {
        const txt = data.cell.raw;
        if (txt === "X") {
          data.cell.styles.textColor = [192, 57, 43];
          data.cell.styles.fontStyle = "bold";
        } else if (txt === "O") {
          data.cell.styles.textColor = [39, 174, 96];
          data.cell.styles.fontStyle = "bold";
        }
      }
    }
  });

  // ─── 푸터 ───
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont(fontName, "normal");
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `보인고 모의내신 | ${studentName} (${studentId}) | ${i}/${totalPages}페이지`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  const filename = `보인고_성적표_${studentId}_${studentName}.pdf`;
  return { doc, filename };
}
