"use client";

import { useState, useEffect } from "react";
import { generatePdfReport } from "../lib/pdfReport";

export default function HomePage() {
  const [stage, setStage] = useState("login");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [mc, setMc] = useState({});
  const [short, setShort] = useState({});
  const [essay, setEssay] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (stage === "exam") {
      const warn = (e) => {
        e.preventDefault();
        e.returnValue = "시험을 중단하시겠습니까?";
        return e.returnValue;
      };
      window.addEventListener("beforeunload", warn);
      return () => window.removeEventListener("beforeunload", warn);
    }
  }, [stage]);

  useEffect(() => {
    const saved = localStorage.getItem("exam_submitted");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setResult(data);
        setStage("result");
      } catch {}
    }
  }, []);

  const handleLogin = () => {
    setError("");
    if (!studentId.trim() || !studentName.trim()) {
      setError("학번과 이름을 모두 입력해 주세요.");
      return;
    }
    if (!/^\d+$/.test(studentId.trim())) {
      setError("학번은 숫자로 입력해 주세요.");
      return;
    }
    setStage("exam");
  };

  const handleSubmit = async () => {
    if (!confirm("답안을 제출하시겠습니까?\n제출 후에는 수정할 수 없습니다.")) return;
    setStage("submitting");
    setError("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentId.trim(),
          studentName: studentName.trim(),
          mc, short, essay,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "제출 실패");
      localStorage.setItem("exam_submitted", JSON.stringify(data));
      setResult(data);
      setStage("result");
    } catch (e) {
      setError(e.message);
      setStage("exam");
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

  if (stage === "login") return <LoginView {...{studentId, setStudentId, studentName, setStudentName, error, handleLogin}} />;
  if (stage === "exam") return <ExamView {...{studentId, studentName, mc, setMc, short, setShort, essay, setEssay, handleSubmit, error}} />;
  if (stage === "submitting") return <SubmittingView />;
  if (stage === "result") return <ResultView result={result} onDownload={downloadPdf} />;
  return null;
}

const S = {
  container: { maxWidth: 720, margin: "0 auto", padding: "16px" },
  card: { background: "white", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  h1: { fontSize: 22, fontWeight: 700, margin: "0 0 12px 0", color: "#111827" },
  h2: { fontSize: 18, fontWeight: 700, margin: "16px 0 8px 0", color: "#2c3e50", borderBottom: "3px solid #2c3e50", paddingBottom: 6 },
  qLabel: { fontSize: 15, fontWeight: 600, marginBottom: 10, color: "#111827" },
  button: { width: "100%", padding: "14px 20px", fontSize: 16, fontWeight: 700, background: "#2c3e50", color: "white", border: "none", borderRadius: 8, cursor: "pointer", touchAction: "manipulation" },
  buttonDanger: { background: "#c0392b" },
  buttonGreen: { background: "#27ae60" },
  buttonGray: { background: "#7f8c8d" },
  input: { width: "100%", padding: "12px", fontSize: 16, border: "2px solid #d1d5db", borderRadius: 8, boxSizing: "border-box", fontFamily: "inherit" },
  textarea: { width: "100%", padding: "12px", fontSize: 15, border: "2px solid #d1d5db", borderRadius: 8, boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", minHeight: 60 },
  error: { color: "#c0392b", fontSize: 14, marginTop: 8, padding: 10, background: "#fef2f2", borderRadius: 6 },
  bubbleRow: { display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" },
  bubble: (selected) => ({
    flex: "1 1 18%", minWidth: 44, minHeight: 44, padding: "10px 0",
    fontSize: 18, fontWeight: 700,
    background: selected ? "#2c3e50" : "white",
    color: selected ? "white" : "#111827",
    border: `2px solid ${selected ? "#2c3e50" : "#d1d5db"}`,
    borderRadius: 8, cursor: "pointer", touchAction: "manipulation",
    display: "flex", alignItems: "center", justifyContent: "center"
  }),
};

function LoginView({ studentId, setStudentId, studentName, setStudentName, error, handleLogin }) {
  return (
    <div style={S.container}>
      <div style={{ ...S.card, marginTop: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#2c3e50", marginBottom: 8 }}>보인고 1학년</h1>
        <h2 style={{ fontSize: 20, color: "#374151", margin: "8px 0 24px 0", fontWeight: 600 }}>2차 모의 내신</h2>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, lineHeight: 1.6 }}>
          객관식 36문항 · 단답형 3문항 · 서술형 4문항<br/>
          총 100점 만점<br/>
          한 번 제출하면 수정할 수 없습니다.
        </div>

        <div style={{ textAlign: "left" }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>학번</label>
          <input type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="예: 10203"
            value={studentId} onChange={e => setStudentId(e.target.value)} style={S.input} />
          <label style={{ fontSize: 14, fontWeight: 600, color: "#374151", display: "block", margin: "16px 0 6px 0" }}>이름</label>
          <input type="text" placeholder="홍길동" value={studentName}
            onChange={e => setStudentName(e.target.value)} style={S.input} />
          {error && <div style={S.error}>{error}</div>}
          <button onClick={handleLogin} style={{ ...S.button, marginTop: 20 }}>시험 시작</button>
        </div>

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
          <a href="/lookup" style={{ fontSize: 13, color: "#2980b9", textDecoration: "underline" }}>
            📊 이미 제출했나요? 내 점수 다시 조회하기
          </a>
        </div>
      </div>
    </div>
  );
}

function SubmittingView() {
  return (
    <div style={S.container}>
      <div style={{ ...S.card, marginTop: 80, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#374151" }}>답안을 채점하는 중입니다...</div>
      </div>
    </div>
  );
}

function ResultView({ result, onDownload }) {
  const { studentName, studentId, mc, short, essay, totalScore, totalMax } = result;

  const formatWrong = (arr, isMc = false) => {
    if (!arr || arr.length === 0) return "없음 (모두 정답!)";
    if (isMc) return arr.join(", ") + "번";
    return arr.map(k => LABELS[k] || k).join(", ");
  };

  return (
    <div style={S.container}>
      <div style={{ ...S.card, marginTop: 20 }}>
        <div style={{ textAlign: "center", padding: "20px 0", background: "linear-gradient(135deg, #2c3e50 0%, #4a5f7a 100%)", borderRadius: 8, color: "white", marginBottom: 20 }}>
          <div style={{ fontSize: 14, opacity: 0.9 }}>{studentName} ({studentId})</div>
          <div style={{ fontSize: 48, fontWeight: 800, margin: "8px 0", lineHeight: 1 }}>{totalScore}</div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>/ {totalMax}점</div>
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "16px 0 12px 0", color: "#2c3e50" }}>영역별 점수</h2>
        <ScoreRow label="객관식" score={mc.score} max={mc.max} />
        <ScoreRow label="단답형" score={short.score} max={short.max} />
        <ScoreRow label="서술형" score={essay.score} max={essay.max} />

        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "24px 0 12px 0", color: "#2c3e50" }}>틀린 문항</h2>
        <WrongList label="객관식" items={formatWrong(mc.wrong, true)} />
        <WrongList label="단답형" items={formatWrong(short.wrong)} />
        <WrongList label="서술형" items={formatWrong(essay.wrong)} />

        <button onClick={onDownload} style={{ ...S.button, ...S.buttonGreen, marginTop: 20 }}>
          📄 상세 리포트 PDF 다운로드
        </button>

        <div style={{ marginTop: 20, padding: 12, background: "#fef3c7", borderRadius: 8, fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
          ※ 정답은 공개되지 않습니다. 선생님께서 해설 수업을 통해 안내해 드립니다.<br/>
          ※ 점수를 나중에 다시 확인하려면 <a href="/lookup" style={{ color: "#92400e", textDecoration: "underline" }}>여기</a>를 클릭하세요.
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

function ExamView({ studentId, studentName, mc, setMc, short, setShort, essay, setEssay, handleSubmit, error }) {
  const setMcValue = (q, v) => setMc({ ...mc, [q]: v });
  const setShortValue = (k, v) => setShort({ ...short, [k]: v });
  const setEssayValue = (k, v) => setEssay({ ...essay, [k]: v });

  const mcAnswered = Object.keys(mc).length;
  const totalAnswered = mcAnswered + Object.values(short).filter(v => v?.trim()).length + Object.values(essay).filter(v => v?.trim()).length;
  const pct = Math.round((totalAnswered / (36 + 9 + 10)) * 100);

  return (
    <div style={S.container}>
      <div style={{ position: "sticky", top: 0, background: "white", zIndex: 10, padding: "12px 0", borderBottom: "2px solid #e5e7eb", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 600, color: "#374151" }}>
          <span>{studentName} ({studentId})</span>
          <span>진행률: {pct}%</span>
        </div>
        <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3, marginTop: 6, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "#2c3e50", transition: "width 0.3s" }} />
        </div>
      </div>

      <div style={{ ...S.card, background: "#fef3c7", border: "1px solid #fde68a" }}>
        <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
          📝 종이 시험지를 보면서 답안을 입력하세요.<br/>
          ⚠️ 한 번 제출하면 수정할 수 없습니다.<br/>
          🔒 새로고침하지 마세요.
        </div>
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>▣ 객관식 (1~36번)</h2>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
          1~6번: 1점 · 7~36번: 2점
        </div>
        {Array.from({length: 36}, (_, i) => i + 1).map(q => (
          <div key={q} style={{ padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
            <div style={S.qLabel}>{q}번 <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 400 }}>({q <= 6 ? 1 : 2}점)</span></div>
            <div style={S.bubbleRow}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setMcValue(q, n)} style={S.bubble(mc[q] === n)}>
                  {["①","②","③","④","⑤"][n-1]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>▣ 단답형 1 <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>(각 1점)</span></h2>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>&lt;보기&gt;에서 공통 단어를 골라 쓰시오.</div>
        {[1,2,3,4].map(n => (
          <div key={n} style={{ marginBottom: 12 }}>
            <div style={S.qLabel}>({n})</div>
            <input type="text" value={short[`short1_${n}`] || ""} onChange={e => setShortValue(`short1_${n}`, e.target.value)}
              style={S.input} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
          </div>
        ))}
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>▣ 서술형 1 <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>((1) 각 1점, (2) 2점)</span></h2>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>(1) 어법상 틀린 3곳 수정된 문장을 쓰시오.</div>
        {["a","b","c"].map((letter, idx) => (
          <div key={letter} style={{ marginBottom: 12 }}>
            <div style={S.qLabel}>① 수정된 문장 {idx+1}</div>
            <textarea value={essay[`essay1_1${letter}`] || ""} onChange={e => setEssayValue(`essay1_1${letter}`, e.target.value)}
              style={S.textarea} placeholder={`수정 문장 ${idx+1}`}
              autoCapitalize="off" autoCorrect="off" spellCheck={false} />
          </div>
        ))}
        <div style={{ fontSize: 13, color: "#6b7280", margin: "16px 0 8px 0" }}>(2) (가)에 들어갈 말</div>
        <input type="text" value={essay.essay1_2 || ""} onChange={e => setEssayValue("essay1_2", e.target.value)}
          style={S.input} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>▣ 단답형 2 <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>(각 2점)</span></h2>
        <div style={{ marginBottom: 12 }}>
          <div style={S.qLabel}>(A) r________</div>
          <input type="text" value={short.short2_A || ""} onChange={e => setShortValue("short2_A", e.target.value)}
            style={S.input} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        </div>
        <div>
          <div style={S.qLabel}>(B) d________</div>
          <input type="text" value={short.short2_B || ""} onChange={e => setShortValue("short2_B", e.target.value)}
            style={S.input} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        </div>
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>▣ 단답형 3 <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>(각 2점)</span></h2>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>consolation prize 함축 의미 빈칸 채우기</div>
        {[1,2,3].map(n => (
          <div key={n} style={{ marginBottom: 12 }}>
            <div style={S.qLabel}>({n})</div>
            <input type="text" value={short[`short3_${n}`] || ""} onChange={e => setShortValue(`short3_${n}`, e.target.value)}
              style={S.input} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
          </div>
        ))}
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>▣ 서술형 2 <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>(각 2.5점)</span></h2>
        <div style={{ marginBottom: 12 }}>
          <div style={S.qLabel}>(1) Keeping a vegetable garden productive ...</div>
          <textarea value={essay.essay2_1 || ""} onChange={e => setEssayValue("essay2_1", e.target.value)}
            style={S.textarea} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        </div>
        <div>
          <div style={S.qLabel}>(2) because ...</div>
          <textarea value={essay.essay2_2 || ""} onChange={e => setEssayValue("essay2_2", e.target.value)}
            style={S.textarea} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        </div>
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>▣ 서술형 3 <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>(각 2.5점)</span></h2>
        <div style={{ marginBottom: 12 }}>
          <div style={S.qLabel}>(A) knowledge becomes ...</div>
          <textarea value={essay.essay3_A || ""} onChange={e => setEssayValue("essay3_A", e.target.value)}
            style={S.textarea} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        </div>
        <div>
          <div style={S.qLabel}>(B) which paradoxically ...</div>
          <textarea value={essay.essay3_B || ""} onChange={e => setEssayValue("essay3_B", e.target.value)}
            style={S.textarea} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        </div>
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>▣ 서술형 4 <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>(5점)</span></h2>
        <div style={S.qLabel}>글의 주제를 영작하시오.</div>
        <textarea value={essay.essay4 || ""} onChange={e => setEssayValue("essay4", e.target.value)}
          style={{ ...S.textarea, minHeight: 80 }}
          autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      </div>

      {error && <div style={{ ...S.card, ...S.error }}>{error}</div>}
      <div style={{ ...S.card, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          답안 작성을 모두 마쳤는지 확인 후 제출하세요.
        </div>
        <button onClick={handleSubmit} style={{ ...S.button, ...S.buttonDanger }}>답안 제출하기</button>
      </div>
    </div>
  );
}
