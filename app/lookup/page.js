"use client";

import { useState } from "react";
import { generatePdfReport } from "../../lib/pdfReport";

export default function LookupPage() {
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleLookup = async () => {
    setError("");
    if (!studentId.trim() || !studentName.trim()) {
      setError("학번과 이름을 모두 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentId.trim(),
          studentName: studentName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "조회 실패");
      if (!data.found) {
        setError("일치하는 시험 기록이 없습니다. 학번과 이름을 다시 확인해 주세요.");
        setLoading(false);
        return;
      }
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!result) return;
    try {
      const { doc, filename } = await generatePdfReport(result);
      doc.save(filename);
    } catch (e) {
      alert("PDF 생성 중 오류: " + e.message);
    }
  };

  if (result) return <ResultView result={result} onDownload={downloadPdf} onBack={() => setResult(null)} />;

  return (
    <div style={S.container}>
      <div style={{ ...S.card, marginTop: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#2c3e50", margin: 0 }}>
            내 점수 조회
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
            보인고 2차 모의내신 결과를 확인합니다
          </p>
        </div>

        <label style={S.label}>학번</label>
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="예: 10203"
          value={studentId}
          onChange={e => setStudentId(e.target.value)}
          style={S.input}
        />

        <label style={S.label}>이름</label>
        <input
          type="text"
          placeholder="홍길동"
          value={studentName}
          onChange={e => setStudentName(e.target.value)}
          style={S.input}
        />

        {error && <div style={S.error}>{error}</div>}

        <button onClick={handleLookup} disabled={loading} style={{ ...S.button, marginTop: 20, opacity: loading ? 0.6 : 1 }}>
          {loading ? "조회 중..." : "조회하기"}
        </button>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <a href="/" style={{ fontSize: 13, color: "#6b7280", textDecoration: "underline" }}>
            ← 시험 응시 페이지로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
function ResultView({ result, onDownload, onBack }) {
  const { studentName, studentId, mc, short, essay, totalScore, totalMax } = result;

  return (
    <div style={S.container}>
      <div style={{ ...S.card, marginTop: 20 }}>
        <div style={{ textAlign: "center", padding: "20px 0", background: "linear-gradient(135deg, #2c3e50 0%, #4a5f7a 100%)", borderRadius: 8, color: "white", marginBottom: 20 }}>
          <div style={{ fontSize: 14, opacity: 0.9 }}>{studentName} ({studentId})</div>
          <div style={{ fontSize: 48, fontWeight: 800, margin: "8px 0", lineHeight: 1 }}>{totalScore}</div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>/ {totalMax}점</div>
        </div>

        <h2 style={S.h2}>영역별 점수</h2>
        <ScoreRow label="객관식" score={mc.score} max={mc.max} />
        <ScoreRow label="단답형" score={short.score} max={short.max} />
        <ScoreRow label="서술형" score={essay.score} max={essay.max} />

        <h2 style={S.h2}>틀린 문항</h2>
        <WrongList label="객관식" items={mc.wrong.length ? mc.wrong.join(", ") + "번" : "없음 (모두 정답!)"} />
        <WrongList label="단답형" items={short.wrong.length ? short.wrong.map(k => LABELS[k] || k).join(", ") : "없음"} />
        <WrongList label="서술형" items={essay.wrong.length ? essay.wrong.map(k => LABELS[k] || k).join(", ") : "없음"} />

        <button onClick={onDownload} style={{ ...S.button, marginTop: 24, background: "#27ae60" }}>
          📄 상세 리포트 PDF 다운로드
        </button>

        <button onClick={onBack} style={{ ...S.button, marginTop: 10, background: "#7f8c8d" }}>
          다시 조회하기
        </button>

        <div style={{ marginTop: 20, padding: 12, background: "#fef3c7", borderRadius: 8, fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
          ※ 정답은 공개되지 않습니다. 선생님께서 해설 수업을 통해 안내해 드립니다.
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, score, max }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14 }}>
        <span style={{ fontWeight: 600, color: "#374151" }}>{label}</span>
        <span style={{ fontWeight: 700, color: "#2c3e50" }}>{score} / {max}점</span>
      </div>
      <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#2c3e50", transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

function WrongList({ label, items }) {
  return (
    <div style={{ marginBottom: 8, padding: 10, background: "#f9fafb", borderRadius: 6 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#111827" }}>{items}</div>
    </div>
  );
}

const LABELS = {
  "short1_1": "단답형1-(1)", "short1_2": "단답형1-(2)", "short1_3": "단답형1-(3)", "short1_4": "단답형1-(4)",
  "short2_A": "단답형2-(A)", "short2_B": "단답형2-(B)",
  "short3_1": "단답형3-(1)", "short3_2": "단답형3-(2)", "short3_3": "단답형3-(3)",
  "essay1_1a": "서술형1-(1)①", "essay1_1b": "서술형1-(1)②", "essay1_1c": "서술형1-(1)③", "essay1_2": "서술형1-(2)",
  "essay2_1": "서술형2-(1)", "essay2_2": "서술형2-(2)",
  "essay3_A": "서술형3-(A)", "essay3_B": "서술형3-(B)",
  "essay4": "서술형4",
};

const S = {
  container: { maxWidth: 720, margin: "0 auto", padding: "16px" },
  card: { background: "white", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  h2: { fontSize: 16, fontWeight: 700, margin: "16px 0 12px 0", color: "#2c3e50" },
  label: { fontSize: 14, fontWeight: 600, color: "#374151", display: "block", margin: "16px 0 6px 0" },
  input: { width: "100%", padding: "12px", fontSize: 16, border: "2px solid #d1d5db", borderRadius: 8, boxSizing: "border-box", fontFamily: "inherit" },
  button: { width: "100%", padding: "14px 20px", fontSize: 16, fontWeight: 700, background: "#2c3e50", color: "white", border: "none", borderRadius: 8, cursor: "pointer" },
  error: { color: "#c0392b", fontSize: 14, marginTop: 12, padding: 10, background: "#fef2f2", borderRadius: 6 },
};
