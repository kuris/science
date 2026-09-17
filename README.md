# 🔬 과학아 놀자!

개념부터 실험까지, 초중고 과학을 쉽고 재미있게 배우는 정적 웹앱입니다.
`playhanja`(한자야 놀자!)와 같은 프로젝트 계열이며, 구조·스타일·로그인 방식을 최대한 재사용했습니다.

- 서비스명: 과학아 놀자!
- 서비스 ID: `science`
- 배포 도메인: https://science.chatgpts.kr
- 대상: 초등학생, 중학생, 고등학생 (+ 학부모/교사)

## AI 기능 없음

- OpenAI/Gemini/Claude 등 어떤 AI API도 사용하지 않습니다.
- 개념·문제·실험 데이터는 정적 JS 파일로 관리합니다.
- 응용 계산 문제(속력·밀도·옴의 법칙·몰)는 `js/generator.js`의 규칙 기반 랜덤 생성으로 만듭니다.

## 주요 기능

1. 초등/중등/고등 과학 개념·법칙·공식 정리 (150개)
2. 개념 카드 + 공식 크게 보기 + 쉬운 설명/비유/암기 팁
3. 개념별 예제 + 연습 문제 (302개 정적 문제 + 규칙 생성)
4. 단원별 연습 (학교급/학년/분야/단원/난이도 선택)
5. 퀴즈 (개념/공식/실험/종합, 제한시간 선택)
6. 오답노트 (저장/다시 풀기/해결 체크)
7. 안전한 실험/관찰 활동 51개 (위험 실험 없음)
8. A4 인쇄용 학습지 (정답지·개념 요약 옵션, `window.print()`)
9. 학습 진도 (비로그인 localStorage / 로그인 Supabase + 병합)
10. 학습 통계 (CSS 막대그래프, 라이브러리 없음)

## 프로젝트 구조

```
science/
├── index.html / concepts.html / concept-view.html
├── practice.html / quiz.html / experiment.html
├── worksheet.html / progress.html / stats.html
├── login.html / admin.html / README.md / ads.txt
├── css/ (style.css, cg-auth.css)
├── js/ (cg-auth.js, nav.js, main.js, science-data.js,
│        concept-data.js, problem-data.js, experiment-data.js,
│        generator.js, concepts.js, practice.js, quiz.js,
│        experiment.js, worksheet.js, progress.js, progress-page.js,
│        stats.js, login.js, auth.js, admin.js, supabase-client.js)
├── docs/ (supabase-science-setup.md, google-login-setup.md)
└── supabase/migrations/001_science_schema.sql
```

## 실행 방법

빌드 도구 없이 정적 서빙만 하면 됩니다.

```bash
cd science
python3 -m http.server 8899
# http://localhost:8899/index.html
```

## Supabase 설정

1. SQL Editor에서 `supabase/migrations/001_science_schema.sql` 실행
2. Settings → API → Exposed schemas에 `science` 추가
3. Authentication → Redirect URLs에 추가:
   - `https://science.chatgpts.kr/`
   - `https://science.chatgpts.kr/login.html`
4. 자세한 내용은 `docs/supabase-science-setup.md`, `docs/google-login-setup.md` 참고

### 데이터 저장 방식

- 계정: 공용 `auth.users`
- 서비스 가입: `public.service_members(service='science')`
- 학습 데이터: `science` 스키마 7개 테이블 (RLS로 본인만 접근)
- 비로그인: localStorage (`science_*` 키) / 로그인 시 Supabase와 병합

## 실험 안전 정책

불·폭발·유독물질·고전압·날카로운 도구가 필요한 실험은 포함하지 않습니다.
모든 실험 페이지에는 보호자 동반 주의 문구가 표시됩니다.

## 향후 확장

- 개념 150개 → 단원별 세분화 추가 가능
- 정적 문제 302개 → 학년별 심화 문제 추가 가능
- 실험 51개 → 계절/날씨 연계 관찰 추가 가능
