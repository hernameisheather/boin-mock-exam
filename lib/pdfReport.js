// ============================================================
// PDF 리포트 생성 (브라우저에서 동작)
// ============================================================

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { QUESTION_LABELS } from "./answerKey";

export function generatePdfReport(result) {
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

  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;

  // ─── 헤더 ───
  doc.setFillColor(44, 62, 80);
  doc.rect(0, 0, pageW, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Boin HS 2nd Mock Exam Report", pageW / 2, 12, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`${studentName} (ID: ${studentId})`, pageW / 2, 20, { align: "center" });
  doc.text(`Submitted: ${submittedAt}`, pageW / 2, 26, { align: "center" });

  doc.setTextColor(0, 0, 0);
  y = 40;

  // ─── 총점 박스 ───
  doc.setFillColor(236, 240, 241);
  doc.roundedRect(15, y, pageW - 30, 25, 3, 3, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Total Score", pageW / 2, y + 7, { align: "center" });
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(44, 62, 80);
  doc.text(`${totalScore} / ${totalMax}`, pageW / 2, y + 18, { align: "center" });
  doc.setTextColor(0, 0, 0);
  y += 32;

  // ─── 영역별 점수 ───
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Section Scores", 15, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Section", "Score", "Max", "Correct"]],
    body: [
      ["Multiple Choice", mc.score, mc.max, `${mc.correct.length} / 36`],
      ["Short Answer", short.score, short.max, `${short.correct.length} / 9`],
      ["Essay", essay.score, essay.max, `${essay.correct.length} / 10`],
    ],
    theme: "grid",
    headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: "bold" },
    bodyStyles: { fontSize: 10 },
    margin: { left: 15, right: 15 },
  });
  y = doc.lastAutoTable.finalY + 8;

  // ─── 객관식 상세 ───
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Multiple Choice Details (36 items)", 15, y);
  y += 4;

  // 객관식: 6x6 그리드로 표시 — O/X + 학생답
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
    bodyStyles: { fontSize: 8, halign: "center" },
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
  doc.setFont("helvetica", "bold");
  if (y > 240) { doc.addPage(); y = 20; }
  doc.text("Short Answer Details", 15, y);
  y += 4;

  const shortBody = Object.keys(QUESTION_LABELS)
    .filter(k => k.startsWith("short"))
    .map(k => {
      const answer = rawAnswers?.short?.[k] || "(blank)";
      const isCorrect = short.correct.includes(k);
      return [QUESTION_LABELS[k], answer, isCorrect ? "O" : "X"];
    });

  autoTable(doc, {
    startY: y,
    head: [["Item", "Your Answer", "Result"]],
    body: shortBody,
    theme: "grid",
    headStyles: { fillColor: [44, 62, 80], textColor: 255 },
    bodyStyles: { fontSize: 9 },
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
  doc.setFont("helvetica", "bold");
  doc.text("Essay Details", 15, y);
  y += 4;

  const essayBody = Object.keys(QUESTION_LABELS)
    .filter(k => k.startsWith("essay"))
    .map(k => {
      const answer = rawAnswers?.essay?.[k] || "(blank)";
      const isCorrect = essay.correct.includes(k);
      return [QUESTION_LABELS[k], answer, isCorrect ? "O" : "X"];
    });

  autoTable(doc, {
    startY: y,
    head: [["Item", "Your Answer", "Result"]],
    body: essayBody,
    theme: "grid",
    headStyles: { fillColor: [44, 62, 80], textColor: 255 },
    bodyStyles: { fontSize: 9 },
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
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Boin HS Mock Exam | ${studentName} (${studentId}) | Page ${i}/${totalPages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  // 파일명
  const filename = `Boin_Exam_${studentId}_${studentName}.pdf`;
  return { doc, filename };
}
