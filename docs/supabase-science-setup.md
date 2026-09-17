# 과학아 놀자! Supabase 설정 가이드 (science 서비스)

`playhanja/docs/supabase-multi-service.md` 방식을 그대로 따릅니다.
계정은 공용 `auth.users`, 서비스 가입은 `public.service_members(service='science')`,
학습 데이터는 `science` 스키마에 저장합니다.

## 1. 마이그레이션 실행

1. Supabase 대시보드 → SQL Editor
2. `supabase/migrations/001_science_schema.sql` 전체를 붙여넣고 실행
3. 생성 확인:
   - `science.user_settings`
   - `science.concept_progress`
   - `science.practice_progress`
   - `science.quiz_results`
   - `science.wrong_notes`
   - `science.study_log`
   - `science.experiment_log`

## 2. API에 스키마 노출

Settings → API → Exposed schemas 에 `science` 추가.
(`public`은 그대로 두고 추가만 합니다.)

## 3. 클라이언트 접속 방식

```js
// science 전용 데이터
createClient(url, key, { db: { schema: 'science' } })
// 또는
sb.schema('science').from('quiz_results').select('*')

// 서비스 가입 (반드시 public 스키마)
await sb.schema('public').from('service_members')
  .insert({ user_id: user.id, service: 'science', nickname: nick });
```

## 4. Google 로그인 Redirect URLs 추가

Authentication → URL Configuration → Redirect URLs에 추가:

```
https://science.chatgpts.kr/
https://science.chatgpts.kr/login.html
https://science.chatgpts.kr/**
http://localhost:8899/login.html
```

구글 클라우드 콘솔에는 Supabase 콜백 URL이 이미 등록되어 있으므로
추가 등록이 필요 없습니다:
`https://ybhiznlelnpwaicyoifa.supabase.co/auth/v1/callback`

## 5. RLS 확인

- 모든 science 테이블은 RLS 활성화
- 본인(`auth.uid() = user_id`) 데이터만 조회/저장 가능
- 프론트에서만 권한 체크하지 않습니다

## 6. 정적 호스팅

- 루트: `play_project/science` (또는 배포 환경의 science 폴더)
- 빌드 도구 불필요, 정적 HTML/CSS/JS 그대로 서빙
- `cg-auth.js`의 `data-service="science"` 확인
