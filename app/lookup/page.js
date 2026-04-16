"use client";

import { useState } from "react";

const LABELS = {
  "short1_1": "단답형1-(1)", "short1_2": "단답형1-(2)", "short1_3": "단답형1-(3)", "short1_4": "단답형1-(4)",
  "short2_A": "단답형2-(A)", "short2_B": "단답형2-(B)",
  "short3_1": "단답형3-(1)", "short3_2": "단답형3-(2)", "short3_3": "단답형3-(3)",
  "essay1_1a": "서술형1-(1)①", "essay1_1b": "서술형1-(1)②", "essay1_1c": "서술형1-(1)③", "essay1_2": "서술형1-(2)",
  "essay2_1": "서술형2-(1)", "essay2_2": "서술형2-(2)",
  "essay3_A": "서술형3-(A)", "essay3_B": "서술형3-(B)",
  "essay4": "서술형4",
};

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

  if (result) return <ResultView result={result} onBack={() => setResult(null)} />;

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

// ============================================================
// 결과 화면 (캡처 친화적 상세 버전)
// ============================================================
function ResultView({ result, onBack }) {
  const { studentName, studentId, mc, short, essay, totalScore, totalMax, submittedAt, rawAnswers } = result;

  return (
    <div style={S.container}>
      {/* 캡처 안내 박스 */}
      <div style={{
        ...S.card,
        background: "#fef3c7",
        border: "1px solid #fde68a",
        marginTop: 12,
      }}>
        <div style={{ fontSize: 14, color: "#92400e", lineHeight: 1.6, textAlign: "center" }}>
          📸 <b>화면 캡처 안내</b><br/>
          <span style={{ fontSize: 13 }}>
            아래 성적표를 스마트폰으로 캡처하여 보관하세요.<br/>
            <b>Android</b>: 전원 + 볼륨 아래 버튼 동시에 누르기<br/>
            <b>iPhone</b>: 측면 + 볼륨 위 버튼 동시에 누르기
          </span>
        </div>
      </div>

      <div id="capture-area" style={{ background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: 16 }}>

        <div style={{
          background: "linear-gradient(135deg, #2c3e50 0%, #4a5f7a 100%)",
          color: "white",
          padding: "20px 16px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 4 }}>보인고 1학년</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>2차 모의내신 성적표</div>
          <div style={{ fontSize: 13, opacity: 0.9, padding: "8px 12px", background: "rgba(255,255,255,0.1)", borderRadius: 6, display: "inline-block" }}>
            {studentName} <span style={{ opacity: 0.7 }}>(학번: {studentId})</span>
          </div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>
            제출: {submittedAt}
          </div>
        </div>

        <div style={{
          padding: "24px 16px",
          textAlign: "center",
          background: "#f8fafc",
          borderBottom: "1px solid #e5e7eb"
        }}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>총점</div>
          <div style={{ fontSize: 52, fontWeight: 800, color: "#2c3e50", lineHeight: 1, margin: "4px 0" }}>
            {totalScore}
          </div>
          <div style={{ fontSize: 16, color: "#6b7280" }}>/ {totalMax}점</div>
        </div>

        <div style={{ padding: "16px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2c3e50", marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #2c3e50" }}>
            ▣ 영역별 점수
          </h3>
          <ScoreRow label="객관식" score={mc.score} max={mc.max} correct={mc.correct.length} total={36} color="#2980b9" />
          <ScoreRow label="단답형" score={short.score} max={short.max} correct={short.correct.length} total={9} color="#16a085" />
          <ScoreRow label="서술형" score={essay.score} max={essay.max} correct={essay.correct.length} total={10} color="#8e44ad" />
        </div>

        <div style={{ padding: "0 16px 16px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2c3e50", marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #2c3e50" }}>
            ▣ 객관식 36문항
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 4,
            fontSize: 11
          }}>
            {Array.from({ length: 36 }, (_, i) => i + 1).map(q => {
              const isCorrect = mc.correct.includes(q);
              const studentAns = rawAnswers?.mc?.[q];
              return (
                <div key={q} style={{
                  padding: "8px 2px",
                  textAlign: "center",
                  borderRadius: 4,
                  background: isCorrect ? "#d1fae5" : "#fee2e2",
                  color: isCorrect ? "#065f46" : "#991b1b",
                  fontWeight: 600,
                  border: `1px solid ${isCorrect ? "#6ee7b7" : "#fca5a5"}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{q}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, margin: "2px 0" }}>
                    {isCorrect ? "O" : "X"}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.75 }}>
                    {studentAns ? `답: ${studentAns}` : "미작성"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "0 16px 16px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2c3e50", marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #2c3e50" }}>
            ▣ 단답형 상세
          </h3>
          {Object.keys(LABELS).filter(k => k.startsWith("short")).map(k => {
            const isCorrect = short.correct.includes(k);
            const answer = rawAnswers?.short?.[k] || "";
            return <AnswerRow key={k} label={LABELS[k]} answer={answer} isCorrect={isCorrect} />;
          })}
        </div>

        <div style={{ padding: "0 16px 16px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2c3e50", marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #2c3e50" }}>
            ▣ 서술형 상세
          </h3>
          {Object.keys(LABELS).filter(k => k.startsWith("essay")).map(k => {
            const isCorrect = essay.correct.includes(k);
            const answer = rawAnswers?.essay?.[k] || "";
            return <AnswerRow key={k} label={LABELS[k]} answer={answer} isCorrect={isCorrect} />;
          })}
        </div>

        <div style={{
          padding: "12px 16px",
          background: "#f8fafc",
          borderTop: "1px solid #e5e7eb",
          fontSize: 10,
          color: "#9ca3af",
          textAlign: "center"
        }}>
          ※ 정답은 공개되지 않습니다 · 선생님께서 해설 수업을 통해 안내해 드립니다
        </div>
      </div>

      <button onClick={onBack} style={{ ...S.button, background: "#7f8c8d", marginBottom: 16 }}>
        다시 조회하기
      </button>

      <div style={{ textAlign: "center", fontSize: 13, color: "#6b7280" }}>
        <a href="/" style={{ color: "#6b7280", textDecoration: "underline" }}>← 메인으로 돌아가기</a>
      </div>
    </div>
  );
}

function ScoreRow({ label, score, max, correct, total, color }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontWeight: 700, color: "#374151", fontSize: 14 }}>{label}</span>
        <span style={{ fontWeight: 700, color: color, fontSize: 15 }}>
          {score} <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: 12 }}>/ {max}점</span>
          <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: 11, marginLeft: 8 }}>
            ({correct}/{total} 정답)
          </span>
        </span>
      </div>
      <div style={{ height: 10, background: "#e5e7eb", borderRadius: 5, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 5 }} />
      </div>
    </div>
  );
}

function AnswerRow({ label, answer, isCorrect }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      background: isCorrect ? "#f0fdf4" : "#fef2f2",
      borderLeft: `4px solid ${isCorrect ? "#27ae60" : "#c0392b"}`,
      marginBottom: 6,
      borderRadius: "0 6px 6px 0"
    }}>
      <div style={{
        minWidth: 32, height: 32,
        background: isCorrect ? "#27ae60" : "#c0392b",
        color: "white",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: 16,
        flexShrink: 0,
      }}>
        {isCorrect ? "O" : "X"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 2 }}>{label}</div>
        <div style={{
          fontSize: 12,
          color: "#6b7280",
          fontFamily: "'Consolas', 'Monaco', monospace",
          wordBreak: "break-word",
          lineHeight: 1.4,
        }}>
          {answer ? `답: ${answer}` : <span style={{ fontStyle: "italic", color: "#9ca3af" }}>(미작성)</span>}
        </div>
      </div>
    </div>
  );
}

const S = {
  container: { maxWidth: 720, margin: "0 auto", padding: "16px" },
  card: { background: "white", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  h2: { fontSize: 16, fontWeight: 700, margin: "16px 0 12px 0", color: "#2c3e50" },
  label: { fontSize: 14, fontWeight: 600, color: "#374151", display: "block", margin: "16px 0 6px 0" },
  input: { width: "100%", padding: "12px", fontSize: 16, border: "2px solid #d1d5db", borderRadius: 8, boxSizing: "border-box", fontFamily: "inherit" },
  button: { width: "100%", padding: "14px 20px", fontSize: 16, fontWeight: 700, background: "#2c3e50", color: "white", border: "none", borderRadius: 8, cursor: "pointer" },
  error: { color: "#c0392b", fontSize: 14, marginTop: 12, padding: 10, background: "#fef2f2", borderRadius: 6 },
};
