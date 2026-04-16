// ============================================================
// 정답 키 & 배점 (총 100점)
// ============================================================

// ── 객관식 정답 (1~36번) ──
export const MC_ANSWERS = {
  1: 2, 2: 4, 3: 3, 4: 3, 5: 4, 6: 3,
  7: 3, 8: 5, 9: 4, 10: 3, 11: 3, 12: 4,
  13: 2, 14: 3, 15: 2, 16: 3, 17: 2, 18: 3,
  19: 2, 20: 5, 21: 4, 22: 1, 23: 3, 24: 5,
  25: 2, 26: 3, 27: 3, 28: 1, 29: 1, 30: 3,
  31: 4, 32: 3, 33: 3, 34: 3, 35: 1, 36: 4,
};

// ── 객관식 배점 ──
// 1~6번: 1점 (어휘 - 쉬움)
// 7~36번: 2점 (독해/어법 - 보통~어려움)
export function getMcPoint(q) {
  return q <= 6 ? 1 : 2;
}
// 객관식 합계: 6×1 + 30×2 = 66점

// ── 단답형 정답 ──
export const SHORT_ANSWERS = {
  "short1_1": { answers: ["bound"], points: 1, label: "단답형1-(1)" },
  "short1_2": { answers: ["dismiss"], points: 1, label: "단답형1-(2)" },
  "short1_3": { answers: ["concentrate"], points: 1, label: "단답형1-(3)" },
  "short1_4": { answers: ["crude"], points: 1, label: "단답형1-(4)" },
  "short2_A": { answers: ["reluctant"], points: 2, label: "단답형2-(A)" },
  "short2_B": { answers: ["disruptions"], points: 2, label: "단답형2-(B)" },
  "short3_1": { answers: ["unfair"], points: 2, label: "단답형3-(1)" },
  "short3_2": { answers: ["external"], points: 2, label: "단답형3-(2)" },
  "short3_3": { answers: ["themselves"], points: 2, label: "단답형3-(3)" },
};
// 단답형 합계: 4×1 + 2×2 + 3×2 = 14점

// ── 서술형 정답 ──
export const ESSAY_ANSWERS = {
  "essay1_1a": {
    answers: ["keep your writing completely private"],
    points: 1,
    label: "서술형1-(1)①"
  },
  "essay1_1b": {
    answers: [
      "let me share the experiences of some people whom I interviewed",
      "let me share the experiences of some people that I interviewed",
      "let me share the experiences of some people who I interviewed",
      "let me share the experiences of some people I interviewed"
    ],
    points: 1,
    label: "서술형1-(1)②"
  },
  "essay1_1c": {
    answers: [
      "Nowadays, I feel less stressed, enjoy my job more, and am more productive",
      "Nowadays I feel less stressed, enjoy my job more, and am more productive"
    ],
    points: 1,
    label: "서술형1-(1)③"
  },
  "essay1_2": {
    answers: ["how I should move towards them"],
    points: 2,
    label: "서술형1-(2)"
  },
  "essay2_1": {
    answers: ["requires constant human intervention"],
    points: 2.5,
    label: "서술형2-(1)"
  },
  "essay2_2": {
    answers: ["it is an inherently unstable state for the ecosystem"],
    points: 2.5,
    label: "서술형2-(2)"
  },
  "essay3_A": {
    answers: ["implicit rather than explicit"],
    points: 2.5,
    label: "서술형3-(A)"
  },
  "essay3_B": {
    answers: ["makes them less capable of teaching the basics"],
    points: 2.5,
    label: "서술형3-(B)"
  },
  "essay4": {
    answers: [
      "Financial markets provide flexibility by separating earning from spending",
      "Financial markets provide flexibility by separating spending from earning"
    ],
    points: 5,
    label: "서술형4"
  },
};
// 서술형 합계: 1+1+1 + 2 + 2.5+2.5 + 2.5+2.5 + 5 = 20점

// ── 총점: 66 + 14 + 20 = 100점 ✅

// ── 정규화: 대소문자 + 공백 무시 ──
export function normalize(str) {
  if (!str) return "";
  return String(str).toLowerCase().replace(/\s+/g, " ").trim();
}

// ── 자동 채점 ──
export function gradeSubmission(submission) {
  const result = {
    mc: { score: 0, max: 0, wrong: [], correct: [] },
    short: { score: 0, max: 0, wrong: [], correct: [] },
    essay: { score: 0, max: 0, wrong: [], correct: [] },
    totalScore: 0,
    totalMax: 100,
  };

  for (let i = 1; i <= 36; i++) {
    const p = getMcPoint(i);
    result.mc.max += p;
    if (submission.mc?.[i] === MC_ANSWERS[i]) {
      result.mc.score += p;
      result.mc.correct.push(i);
    } else {
      result.mc.wrong.push(i);
    }
  }

  for (const [key, info] of Object.entries(SHORT_ANSWERS)) {
    result.short.max += info.points;
    const sn = normalize(submission.short?.[key]);
    if (info.answers.some(a => normalize(a) === sn)) {
      result.short.score += info.points;
      result.short.correct.push(key);
    } else {
      result.short.wrong.push(key);
    }
  }

  for (const [key, info] of Object.entries(ESSAY_ANSWERS)) {
    result.essay.max += info.points;
    const sn = normalize(submission.essay?.[key]);
    if (info.answers.some(a => normalize(a) === sn)) {
      result.essay.score += info.points;
      result.essay.correct.push(key);
    } else {
      result.essay.wrong.push(key);
    }
  }

  const round1 = (n) => Math.round(n * 10) / 10;
  result.mc.score = round1(result.mc.score);
  result.short.score = round1(result.short.score);
  result.essay.score = round1(result.essay.score);
  result.totalScore = round1(result.mc.score + result.short.score + result.essay.score);

  return result;
}

export const QUESTION_LABELS = Object.fromEntries([
  ...Object.entries(SHORT_ANSWERS).map(([k, v]) => [k, v.label]),
  ...Object.entries(ESSAY_ANSWERS).map(([k, v]) => [k, v.label]),
]);
