"use client";

import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("dashboard_auth");
    if (saved) {
      setPassword(saved);
      authenticate(saved);
    }
  }, []);

  const authenticate = async (pw) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "인증 실패");
      setData(json);
      setAuthenticated(true);
      sessionStorage.setItem("dashboard_auth", pw);
    } catch (e) {
      setError(e.message);
      sessionStorage.removeItem("dashboard_auth");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("dashboard_auth");
    setAuthenticated(false);
    setData(null);
    setPassword("");
  };

  if (!authenticated) {
    return (
      <div style={S.container}>
        <div style={{ ...S.card, marginTop: 80, maxWidth: 400, margin: "80px auto" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 32 }}>🔒</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#2c3e50", margin: "8px 0" }}>
              교사용 대시보드
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280" }}>비밀번호를 입력하세요</p>
          </div>

          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && authenticate(password)}
            style={S.input}
          />
          {error && <div style={S.error}>{error}</div>}
          <button
            onClick={() => authenticate(password)}
            disabled={loading}
            style={{ ...S.button, marginTop: 16, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "확인 중..." : "로그인"}
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.records || data.records.length === 0) {
    return (
      <div style={S.container}>
        <div style={{ ...S.card, marginTop: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>아직 제출된 답안이 없습니다</h1>
          <button onClick={logout} style={{ ...S.button, marginTop: 20, background: "#7f8c8d" }}>로그아웃</button>
        </div>
      </div>
    );
  }

  return <DashboardView data={data} onLogout={logout} />;
}

// ────────────────────────────────────────────────────────────
function DashboardView({ data, onLogout }) {
  const { records } = data;
  const [filter, setFilter] = useState("all"); // all | 1반 | 2반 ...
  const [sort, setSort] = useState("score_desc"); // score_desc | score_asc | name | time

  // 반 목록 추출 (학번 앞 2자리 = 학년+반)
  const classes = [...new Set(records.map(r => {
    const id = String(r.studentId);
    return id.length >= 3 ? id.substring(0, 3) : id;
  }))].sort();

  // 필터링
  let filtered = filter === "all"
    ? records
    : records.filter(r => String(r.studentId).startsWith(filter));

  // 정렬
  filtered = [...filtered].sort((a, b) => {
    if (sort === "score_desc") return b.totalScore - a.totalScore;
    if (sort === "score_asc") return a.totalScore - b.totalScore;
    if (sort === "name") return a.studentName.localeCompare(b.studentName);
    if (sort === "time") return new Date(b.submittedAt) - new Date(a.submittedAt);
    return 0;
  });

  // 통계
  const scores = filtered.map(r => r.totalScore);
  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
  const max = scores.length ? Math.max(...scores) : 0;
  const min = scores.length ? Math.min(...scores) : 0;
  const median = scores.length
    ? [...scores].sort((a, b) => a - b)[Math.floor(scores.length / 2)]
    : 0;

  // 점수 분포 (10점 구간)
  const bins = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 0-9, 10-19, ..., 90-100
  filtered.forEach(r => {
    const b = Math.min(Math.floor(r.totalScore / 10), 9);
    bins[b]++;
  });
  const maxBin = Math.max(...bins, 1);

  // 문항별 정답률
  const questionStats = {};
  filtered.forEach(r => {
    // 틀린 객관식
    const wrongMc = (r.wrongMc || "").split(",").map(s => s.trim()).filter(s => s && s !== "없음");
    for (let q = 1; q <= 36; q++) {
      const key = `객관식 ${q}번`;
      if (!questionStats[key]) questionStats[key] = { total: 0, wrong: 0 };
      questionStats[key].total++;
      if (wrongMc.includes(String(q))) questionStats[key].wrong++;
    }
  });

  // 정답률 낮은 순으로 정렬
  const hardestQuestions = Object.entries(questionStats)
    .map(([k, v]) => ({
      name: k,
      correctRate: ((v.total - v.wrong) / v.total * 100).toFixed(0)
    }))
    .sort((a, b) => a.correctRate - b.correctRate)
    .slice(0, 10);

  return (
    <div style={{ ...S.container, maxWidth: 1200 }}>
      <div style={{ ...S.card, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#2c3e50", margin: 0 }}>
              📊 교사용 대시보드
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
              보인고 2차 모의내신 응답 현황
            </p>
          </div>
          <button onClick={onLogout} style={{ padding: "8px 16px", fontSize: 13, background: "#7f8c8d", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
            로그아웃
          </button>
        </div>
      </div>

      {/* 통계 요약 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
        <StatCard label="응시자 수" value={filtered.length + "명"} color="#2c3e50" />
        <StatCard label="평균" value={avg + "점"} color="#27ae60" />
        <StatCard label="최고" value={max + "점"} color="#2980b9" />
        <StatCard label="최저" value={min + "점"} color="#c0392b" />
        <StatCard label="중앙값" value={median + "점"} color="#8e44ad" />
      </div>

      {/* 필터 */}
      <div style={{ ...S.card, padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>반 필터:</span>
          <button onClick={() => setFilter("all")} style={filterBtn(filter === "all")}>전체</button>
          {classes.map(c => (
            <button key={c} onClick={() => setFilter(c)} style={filterBtn(filter === c)}>{c}</button>
          ))}
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginLeft: 16 }}>정렬:</span>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}>
            <option value="score_desc">점수 높은순</option>
            <option value="score_asc">점수 낮은순</option>
            <option value="name">이름순</option>
            <option value="time">제출순</option>
          </select>
        </div>
      </div>

      {/* 점수 분포 그래프 */}
      <div style={S.card}>
        <h2 style={S.h2}>점수 분포</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 160, padding: "10px 0" }}>
          {bins.map((n, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#2c3e50", marginBottom: 4 }}>
                {n > 0 ? n : ""}
              </div>
              <div style={{
                width: "100%",
                height: `${(n / maxBin) * 100}%`,
                background: i === 9 ? "#27ae60" : i >= 7 ? "#2980b9" : i >= 4 ? "#f39c12" : "#c0392b",
                borderRadius: "4px 4px 0 0",
                minHeight: n > 0 ? 4 : 0,
                transition: "height 0.3s"
              }} />
              <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4, textAlign: "center" }}>
                {i * 10}<br/>~{i === 9 ? 100 : (i + 1) * 10 - 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 정답률 낮은 문제 */}
      <div style={S.card}>
        <h2 style={S.h2}>정답률 낮은 객관식 10문항</h2>
        <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#2c3e50", color: "white" }}>
                <th style={tdH}>순위</th>
                <th style={tdH}>문항</th>
                <th style={tdH}>정답률</th>
                <th style={tdH}>시각화</th>
              </tr>
            </thead>
            <tbody>
              {hardestQuestions.map((q, i) => (
                <tr key={q.name} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={td}>{i + 1}</td>
                  <td style={td}>{q.name}</td>
                  <td style={{ ...td, fontWeight: 700, color: q.correctRate < 30 ? "#c0392b" : q.correctRate < 50 ? "#f39c12" : "#27ae60" }}>
                    {q.correctRate}%
                  </td>
                  <td style={td}>
                    <div style={{ background: "#e5e7eb", height: 10, borderRadius: 5, overflow: "hidden", width: 140 }}>
                      <div style={{
                        width: `${q.correctRate}%`, height: "100%",
                        background: q.correctRate < 30 ? "#c0392b" : q.correctRate < 50 ? "#f39c12" : "#27ae60"
                      }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 학생 목록 */}
      <div style={S.card}>
        <h2 style={S.h2}>학생 응답 목록 ({filtered.length}명)</h2>
        <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#2c3e50", color: "white" }}>
                <th style={tdH}>순위</th>
                <th style={tdH}>학번</th>
                <th style={tdH}>이름</th>
                <th style={tdH}>총점</th>
                <th style={tdH}>객관식</th>
                <th style={tdH}>단답형</th>
                <th style={tdH}>서술형</th>
                <th style={tdH}>제출시각</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.studentId + r.submittedAt} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={td}>{i + 1}</td>
                  <td style={td}>{r.studentId}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{r.studentName}</td>
                  <td style={{ ...td, fontWeight: 700, color: "#2c3e50" }}>{r.totalScore}</td>
                  <td style={td}>{r.mcScore}/{r.mcMax}</td>
                  <td style={td}>{r.shortScore}/{r.shortMax}</td>
                  <td style={td}>{r.essayScore}/{r.essayMax}</td>
                  <td style={{ ...td, fontSize: 11, color: "#6b7280" }}>{r.submittedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "white", padding: 16, borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

const filterBtn = (active) => ({
  padding: "6px 12px",
  fontSize: 13,
  background: active ? "#2c3e50" : "white",
  color: active ? "white" : "#2c3e50",
  border: `1px solid ${active ? "#2c3e50" : "#d1d5db"}`,
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
});

const td = { padding: "10px 12px", textAlign: "center", color: "#374151" };
const tdH = { padding: "10px 12px", textAlign: "center", fontWeight: 700, fontSize: 12 };

const S = {
  container: { maxWidth: 1200, margin: "0 auto", padding: "16px" },
  card: { background: "white", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  h2: { fontSize: 16, fontWeight: 700, margin: "0 0 12px 0", color: "#2c3e50", borderBottom: "2px solid #e5e7eb", paddingBottom: 8 },
  input: { width: "100%", padding: "12px", fontSize: 16, border: "2px solid #d1d5db", borderRadius: 8, boxSizing: "border-box", fontFamily: "inherit" },
  button: { width: "100%", padding: "14px 20px", fontSize: 16, fontWeight: 700, background: "#2c3e50", color: "white", border: "none", borderRadius: 8, cursor: "pointer" },
  error: { color: "#c0392b", fontSize: 14, marginTop: 12, padding: 10, background: "#fef2f2", borderRadius: 6 },
};
