/* ============================================================
   과학아 놀자! - Supabase 클라이언트 (science 스키마)
   - 계정은 공용 auth.users, 데이터는 science 스키마에 저장
   - docs/supabase-science-setup.md 참고
   ============================================================ */
var SUPABASE_URL = 'https://ybhiznlelnpwaicyoifa.supabase.co';
var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_H4gFRiLEjE8h8s_EX4tKzg__ZKpsBR1';
var SUPABASE_SCHEMA = 'science';

(function () {
  if (typeof window === 'undefined') return;
  window.SUPABASE_URL = SUPABASE_URL;
  window.SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;
  window.SUPABASE_SCHEMA = SUPABASE_SCHEMA;
  window.SUPABASE_AUTH_STORAGE_KEY = 'sb-ybhiznlelnpwaicyoifa-auth-token';
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        db: { schema: 'science' },
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    } catch (e) {
      console.warn('[과학아 놀자] Supabase 클라이언트 생성 실패:', e);
      window.sb = null;
    }
  } else {
    console.warn('[과학아 놀자] supabase-js 로드 실패 - 로컬 저장 모드로 동작합니다.');
    window.sb = null;
  }
  // science 스키마 접근 헬퍼 (없으면 public 폴백)
  window.scienceDb = function () {
    if (!window.sb) return null;
    try {
      return (typeof window.sb.schema === 'function') ? window.sb.schema('science') : window.sb;
    } catch (e) { return window.sb; }
  };
  window.publicDb = function () {
    if (!window.sb) return null;
    try {
      return (typeof window.sb.schema === 'function') ? window.sb.schema('public') : window.sb;
    } catch (e) { return window.sb; }
  };
})();
