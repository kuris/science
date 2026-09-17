# 구글 로그인 연동 설정 가이드 (과학아 놀자!)

코드는 이미 준비되어 있습니다. Supabase 설정만 마치면 동작합니다.

- 로그인 모듈: `js/cg-auth.js` (원본: `_shared/cg-auth.js`, Google 전용)
- 서비스 로직: `js/auth.js` (`service='science'` 가입 처리)
- 버튼: `login.html`의 구글 로그인 버튼, 전 페이지 `#cg-auth-slot`

## 1. Supabase에 science 도메인 등록

Authentication → URL Configuration:

| 항목 | 값 |
|---|---|
| Site URL | `https://science.chatgpts.kr` (기존 유지) |
| Redirect URLs (추가) | `https://science.chatgpts.kr/` |
| | `https://science.chatgpts.kr/login.html` |
| | `https://science.chatgpts.kr/**` |

## 2. Google provider

이미 켜져 있는 Google provider를 그대로 씁니다 (계정 단위 설정).
승인된 자바스크립트 원본에 `https://science.chatgpts.kr` 추가:

1. Google Cloud Console → API 및 서비스 → 사용자 인증 정보
2. OAuth 클라이언트 → 승인된 자바스크립트 원본에 추가:
   ```
   https://science.chatgpts.kr
   ```
3. 승인된 리디렉션 URI는 그대로 (Supabase 콜백 URL):
   ```
   https://ybhiznlelnpwaicyoifa.supabase.co/auth/v1/callback
   ```

## 3. 동작 확인

1. `https://science.chatgpts.kr/login.html` 접속
2. "구글로 로그인" 클릭 → 구글 계정 선택 → 복귀
3. 헤더에 닉네임 표시, `public.service_members`에 `service='science'` 행 생성 확인

## 4. 자주 만나는 오류

| 증상 | 원인 | 해결 |
|---|---|---|
| 로그인 후 돌아오지 못함 | Redirect URLs 미등록 | 1단계 주소 추가 |
| `redirect_uri_mismatch` | 구글 원본 미등록 | 2단계 원본 추가 |
| 가입 행이 안 생김 | RLS/권한 | service_members 정책 확인 |
