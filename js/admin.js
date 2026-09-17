/* 과학아 놀자! - admin.html 최소 관리자 패널 (phiskim@gmail.com 폴백) */
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  var loading = document.getElementById('admin-loading');
  var authView = document.getElementById('admin-auth-view');
  var deniedView = document.getElementById('admin-denied-view');
  var dashView = document.getElementById('admin-dashboard-view');
  if (!loading) return;

  function show(el) { [authView, deniedView, dashView].forEach(function (v) { if (v) v.style.display = 'none'; }); if (el) el.style.display = 'block'; loading.style.display = 'none'; }

  var googleBtn = document.getElementById('admin-google-btn');
  if (googleBtn) googleBtn.addEventListener('click', function () {
    if (window.ScienceAuth) window.ScienceAuth.signInWithGoogle(location.origin + location.pathname);
  });
  document.querySelectorAll('.js-admin-logout').forEach(function (b) {
    b.addEventListener('click', async function () { if (window.ScienceAuth) await window.ScienceAuth.signOut(); location.reload(); });
  });

  async function check() {
    await new Promise(function (r) { setTimeout(r, 800); });
    if (window.CGAuth && window.CGAuth.ready) { try { await window.CGAuth.ready(); } catch (e) {} }
    var isAdmin = window.ScienceAuth && window.ScienceAuth.isAdmin();
    var user = window.ScienceAuth && window.ScienceAuth.getUser();
    if (!user) { show(authView); return; }
    if (!isAdmin) {
      var em = document.getElementById('denied-user-email');
      if (em) em.textContent = user.email || '';
      show(deniedView);
      return;
    }
    show(dashView);
    loadStats();
  }

  async function loadStats() {
    var box = document.getElementById('admin-stats');
    if (!box) return;
    var db = window.scienceDb ? window.scienceDb() : null;
    if (!db) { box.innerHTML = '<p class="muted">Supabase 연결 없음 - 로컬 모드예요.</p>'; return; }
    try {
      var tables = ['concept_progress', 'quiz_results', 'study_log', 'wrong_notes', 'experiment_log'];
      var rows = await Promise.all(tables.map(async function (t) {
        try {
          var r = await db.from(t).select('id', { count: 'exact', head: true });
          return { t: t, n: (r && r.count != null) ? r.count : '?' };
        } catch (e) { return { t: t, n: 'RLS 제한' }; }
      }));
      var recent = [];
      try {
        var q = await db.from('study_log').select('*').order('created_at', { ascending: false }).limit(10);
        recent = (q && q.data) || [];
      } catch (e) {}
      box.innerHTML = '<div class="stat-grid">' + rows.map(function (r) {
        return '<div class="stat-card"><strong>' + esc(r.n) + '</strong><span>' + esc(r.t) + '</span></div>';
      }).join('') + '</div>' +
      '<div class="info-box"><h3>최근 학습 현황 (최대 10개)</h3>' +
      (recent.length ? recent.map(function (l) {
        return '<div class="dash-hist-row"><span>' + esc(l.activity_type) + ' · ' + esc(l.field || '-') + '</span><span class="muted">' + esc(String(l.created_at || '').slice(0, 16).replace('T', ' ')) + '</span></div>';
      }).join('') : '<p class="muted">최근 기록이 없어요.</p>') + '</div>';
    } catch (e) {
      box.innerHTML = '<p class="muted">통계를 불러오지 못했어요.</p>';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check);
  else check();
})();
