# 📱 보인고 2차 모의내신 웹앱

스마트폰에서 응시 가능한 시험 자동 채점 시스템.

## 🚀 시작하기

**`SETUP_GUIDE.md`** 파일을 참고하여 세팅하세요.

## ✨ 주요 기능

### 학생용
- 📱 스마트폰 최적화 UI (학번+이름 로그인)
- ⚡ 제출 즉시 자동 채점 (100점 만점)
- 📊 영역별 점수 + 틀린 문항 표시
- 📄 **개인 PDF 리포트 다운로드** (답안 전체 포함)
- 🔍 **나중에 점수 재조회 가능**

### 교사용
- 💾 Google Sheets 자동 기록
- 📱 Telegram 실시간 알림
- 📧 Gmail 상세 리포트 메일
- 📊 **대시보드**: 반별/전체 평균, 점수 분포, 문항별 정답률

### 채점 기준
- 객관식: 정답 번호 일치
- 단답형/서술형: 대소문자·공백 무시 후 정확 일치
- 복수 정답 허용

## 📁 파일 구조

```
quiz-app/
├── app/
│   ├── layout.js                 # 전역 레이아웃
│   ├── page.js                   # 메인 (로그인/시험/결과)
│   ├── lookup/page.js            # 학생 점수 재조회
│   ├── dashboard/page.js         # 교사 대시보드
│   └── api/
│       ├── submit/route.js       # 제출 & 채점 API
│       ├── lookup/route.js       # 조회 API
│       └── dashboard/route.js    # 대시보드 데이터 API
├── lib/
│   ├── answerKey.js              # 정답 + 배점 + 채점 로직
│   └── pdfReport.js              # PDF 생성
├── google-apps-script.js         # Apps Script (Sheets)
├── SETUP_GUIDE.md                # 📖 세팅 가이드
├── package.json
└── next.config.js
```

## 🔗 URL

배포 후 사용:

- **학생 시험 응시**: `/`
- **학생 점수 재조회**: `/lookup`
- **교사 대시보드**: `/dashboard` (비밀번호 보호)

## 💰 비용: **무료**

GitHub, Vercel, Google, Telegram 모두 무료 사용.
