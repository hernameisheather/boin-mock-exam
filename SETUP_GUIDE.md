# 📱 보인고 2차 모의내신 스마트폰 시험 시스템 — 세팅 가이드

**총 소요 시간: 약 30~45분 (처음 한 번만 세팅)**

---

## ✨ 포함된 기능

| 기능 | 설명 |
|------|------|
| 📝 시험 응시 | 학생이 스마트폰으로 학번+이름 입력 후 응시 |
| ⚡ 자동 채점 | 제출 즉시 객관식/단답형/서술형 전부 자동 채점 (100점 만점) |
| 💾 Google Sheets 저장 | 모든 제출 자동 기록 |
| 📱 Telegram 알림 | 선생님 스마트폰으로 즉시 푸시 알림 |
| 📧 Gmail 알림 | 선생님 이메일로 상세 리포트 발송 |
| 📄 **학생 PDF 리포트** | 제출 후 개인 점수표 PDF 다운로드 |
| 📊 **교사 대시보드** | 반별/전체 평균, 점수 분포, 문항별 정답률 |
| 🔍 **점수 재조회** | 학생이 나중에 본인 점수 다시 확인 |

---

## 📋 준비물

- [ ] Gmail 계정
- [ ] 스마트폰 (Telegram 앱 설치 필요)
- [ ] PC

---

## 🔢 배점 체계 (총 100점)

| 영역 | 문항 | 배점 | 소계 |
|------|------|------|------|
| 객관식 1~6번 | 6 | 1점 | 6점 |
| 객관식 7~36번 | 30 | 2점 | 60점 |
| 단답형 1 | 4칸 | 1점 | 4점 |
| 단답형 2 | 2칸 | 2점 | 4점 |
| 단답형 3 | 3칸 | 2점 | 6점 |
| 서술형 1-(1) | 3칸 | 1점 | 3점 |
| 서술형 1-(2) | 1칸 | 2점 | 2점 |
| 서술형 2 | 2칸 | 2.5점 | 5점 |
| 서술형 3 | 2칸 | 2.5점 | 5점 |
| 서술형 4 | 1칸 | 5점 | 5점 |
| **총** | | | **100점** |

---

## STEP 1. Telegram 봇 만들기 (5분)

1. Telegram 앱 열기 → 검색창에 **`@BotFather`** 입력
2. BotFather와 대화 시작 → `/newbot` 입력
3. 봇 이름 입력 (예: `보인고 모의내신 알림`)
4. 봇 사용자명 입력 (예: `boin_exam_bot`) — `_bot`으로 끝나야 함
5. **Bot Token** 메모 (예: `7123456789:AAH...`)
6. 만든 봇과 대화 시작 → 아무 메시지나 `/start` 전송
7. 검색창에 **`@userinfobot`** 검색 → `/start` 전송 → 본인의 **ID** 메모

### 📌 메모해둘 것
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

---

## STEP 2. Google Sheets + Apps Script 세팅 (10분)

### 2-1. Google Sheets 생성
1. https://sheets.google.com 접속
2. 새 스프레드시트 만들기 → 이름: `보인고_모의내신_응답`
3. 비워둔 채로 둘 것 (자동으로 헤더 생성됨)

### 2-2. Apps Script 코드 입력
1. 스프레드시트 상단 → **확장 프로그램** → **Apps Script** 클릭
2. 기본 `myFunction` 코드 모두 삭제
3. `google-apps-script.js` 파일 내용 전체 복사 → 붙여넣기
4. **상단 `TEACHER_EMAIL`을 본인 Gmail 주소로 수정**:
   ```js
   const TEACHER_EMAIL = "myemail@gmail.com";
   ```
5. 저장 (Ctrl+S 또는 💾)

### 2-3. 웹 앱으로 배포
1. 우측 상단 **배포** → **새 배포**
2. 톱니바퀴 → **웹 앱** 선택
3. 설정:
   - **설명**: `보인고 모의내신` (아무거나)
   - **다음 사용자로 실행**: `나`
   - **액세스 권한이 있는 사용자**: **모든 사용자** ⚠️ 필수
4. **배포** 클릭 → 첫 배포 시 권한 승인:
   - 액세스 승인 → Gmail 계정 선택
   - "고급" → "안전하지 않음으로 이동" → "허용"
5. **웹 앱 URL** 복사 (예: `https://script.google.com/macros/s/AKfyc.../exec`)

### 📌 메모해둘 것
- `GOOGLE_SCRIPT_URL`

---

## STEP 3. GitHub에 코드 업로드 (5분)

1. https://github.com 계정 생성/로그인
2. 우측 상단 **+** → **New repository**
3. Repository 이름: `boin-mock-exam`
4. **Public** 선택 → **Create repository**
5. **"uploading an existing file"** 링크 클릭
6. `quiz-app/` 폴더의 모든 파일을 드래그 앤 드롭:
   - `app/` 폴더 전체
   - `lib/` 폴더 전체
   - `package.json`
   - `next.config.js`
7. **Commit changes** 클릭

---

## STEP 4. Vercel 배포 (10분)

1. https://vercel.com → **Sign Up** → **Continue with GitHub** → 권한 승인
2. **New Project** → 방금 만든 repo 선택 → **Import**
3. **Framework Preset**: `Next.js` (자동)
4. **Environment Variables** 에 **4개** 추가:

   | Name | Value |
   |------|-------|
   | `TELEGRAM_BOT_TOKEN` | Step 1에서 받은 봇 토큰 |
   | `TELEGRAM_CHAT_ID` | Step 1에서 찾은 본인 ID |
   | `GOOGLE_SCRIPT_URL` | Step 2에서 받은 웹 앱 URL |
   | `DASHBOARD_PASSWORD` | 대시보드 접속 비밀번호 (직접 정함, 예: `boin2026`) |

5. **Deploy** 클릭 → 1~2분 후 완료
6. 배포 URL 복사 (예: `https://boin-mock-exam.vercel.app`)

---

## STEP 5. 테스트 (5분)

### 5-1. 학생 시험 응시 테스트
1. 스마트폰으로 배포 URL 접속
2. 학번·이름 입력 → 시험 시작
3. 몇 문제 답하고 제출
4. 확인:
   - [ ] 점수가 화면에 표시되는가?
   - [ ] PDF 다운로드가 되는가?
   - [ ] Telegram에 알림이 왔는가?
   - [ ] Gmail에 알림이 왔는가?
   - [ ] Google Sheets에 기록되었는가?

### 5-2. 교사 대시보드 테스트
1. URL 뒤에 `/dashboard` 추가 → 접속 (예: `https://boin-mock-exam.vercel.app/dashboard`)
2. 설정한 비밀번호 입력 → 로그인
3. 확인:
   - [ ] 통계 요약이 뜨는가?
   - [ ] 학생 응답 목록이 보이는가?
   - [ ] 점수 분포 그래프가 나오는가?

### 5-3. 학생 점수 재조회 테스트
1. URL 뒤에 `/lookup` 추가 (예: `https://boin-mock-exam.vercel.app/lookup`)
2. 학번·이름 입력 → 조회
3. 확인:
   - [ ] 이전 점수가 조회되는가?
   - [ ] PDF 다운로드가 되는가?

---

## 📢 학생에게 배포

### QR 코드 생성 (추천)
1. https://www.qr-code-generator.com 접속
2. Vercel 배포 URL 붙여넣기 → QR 다운로드
3. 칠판/화면에 공유

### 학생 안내문 예시
```
📱 보인고 2차 모의내신

1. QR 스캔 또는 아래 링크 접속:
   https://boin-mock-exam.vercel.app

2. 학번+이름 입력 → 시험 시작
3. 답안 입력 → 제출 → 즉시 점수 확인!
4. PDF 리포트 다운로드 가능

📊 나중에 점수 다시 확인하려면:
   https://boin-mock-exam.vercel.app/lookup

⚠️ 주의
- 한 번 제출 후 수정 불가
- 새로고침 금지 (답안 사라짐)
```

---

## 🔗 주요 URL 정리

배포 후 사용할 링크 3개:

| 용도 | URL | 대상 |
|------|-----|------|
| 시험 응시 | `https://YOUR_APP.vercel.app/` | 학생 |
| 점수 재조회 | `https://YOUR_APP.vercel.app/lookup` | 학생 |
| 교사 대시보드 | `https://YOUR_APP.vercel.app/dashboard` | 선생님 |

---

## 🔧 문제 해결

### Q. Telegram 알림 안 와요
- `TELEGRAM_CHAT_ID` 값 확인
- 봇과 먼저 `/start` 대화했는지 확인
- Vercel 환경변수 수정 후엔 **Redeploy** 필요

### Q. Google Sheets 저장 안 돼요
- Apps Script 배포 시 "모든 사용자"로 했는지 확인
- `GOOGLE_SCRIPT_URL`이 `/exec`로 끝나는지 확인

### Q. 대시보드에 비밀번호 넣어도 로그인 안 돼요
- `DASHBOARD_PASSWORD` 환경변수 Vercel에 제대로 추가했는지 확인
- 대소문자 정확히 일치해야 함

### Q. 학생 재조회가 안 돼요
- 학번+이름이 **제출 시 입력한 것과 정확히 일치**해야 함
- 공백이나 오타 확인

### Q. 환경변수 수정해도 안 변해요
- Vercel → Deployments → **Redeploy** 클릭

---

## 💰 비용 = **0원**

- GitHub, Vercel, Google (Sheets+Apps Script+Gmail), Telegram 모두 무료

---

## 🎯 더 필요한 기능이 있으시면 요청하세요

- 서술형 유사도 채점 (오타 허용)
- 학급별 엑셀 다운로드
- 학생 이메일 일괄 발송
- 시간 제한 기능
