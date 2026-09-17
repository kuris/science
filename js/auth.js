/* ============================================================
   과학아 놀자! - 로그인/진도 동기화 (playhanja auth.js 참고)
   - Google 로그인은 CGAuth + window.sb 사용
   - 이 파일은 science 전용: service_members service='science',
     science 스키마 진도 병합을 담당합니다.
   ============================================================ */
(function () {
  var SERVICE = 'science';
  var ADMIN_EMAILS = ['phiskim@gmail.com'];
  var currentUser = null;
  var syncing = false;

  function isAdmin(user) {
    if (!user) return false;
    return ADMIN_EMAILS.indexOf(String(user.email || '').toLowerCase().trim()) !== -1;
  }
  function sb() { return window.sb || null; }
  function sdb() { return window.scienceDb ? window.scienceDb() : sb(); }
  function pdb() { return window.publicDb ? window.publicDb() : sb(); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function ensureMembership() {
    if (!currentUser || !sb()) return { isNew: false };
    try {
      var r = await pdb().from('service_members').select('*').eq('user_id', currentUser.id).eq('service', SERVICE);
      var existing = r.data && r.data[0];
      if (existing) {
        pdb().from('service_members').update({ last_seen_at: new Date().toISOString(), role: isAdmin(currentUser) ? 'admin' : existing.role })
          .eq('user_id', currentUser.id).eq('service', SERVICE).then(function () {}, function () {});
        return { isNew: false, status: existing.status };
      }
      var meta = currentUser.user_metadata || {};
      var nick = meta.nickname || meta.full_name || meta.name || String(currentUser.email || '').split('@')[0];
      await pdb().from('service_members').insert({ user_id: currentUser.id, service: SERVICE, role: isAdmin(currentUser) ? 'admin' : 'member', nickname: nick, last_seen_at: new Date().toISOString() });
      return { isNew: true, status: 'active' };
    } catch (e) {
      console.warn('[과학아 놀자] 가입 확인 실패:', e);
      return { isNew: false };
    }
  }

  // 로그인 시 localStorage 진도를 Supabase와 병합
  async function syncProgressOnLogin() {
    if (!currentUser || syncing || !window.ScienceProgress) return;
    syncing = true;
    try {
      await window.ScienceProgress.mergeLocalToCloud();
      document.dispatchEvent(new CustomEvent('science:progress-synced'));
    } catch (e) {
      console.warn('[과학아 놀자] 진도 동기화 실패:', e);
    } finally { syncing = false; }
  }

  async function signInWithGoogle(redirectTo) {
    if (window.CGAuth && window.CGAuth.signInWithGoogle) return window.CGAuth.signInWithGoogle(redirectTo);
    if (!sb()) throw new Error('서버 연결을 준비하지 못했어요.');
    var target = redirectTo || (location.origin + location.pathname);
    var r = await sb().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: target, queryParams: { prompt: 'select_account' } } });
    if (r.error) throw r.error;
  }
  async function signOut() {
    if (window.CGAuth && window.CGAuth.signOut) return window.CGAuth.signOut();
    if (sb()) await sb().auth.signOut();
    currentUser = null;
    renderAuthBox();
  }
  function displayName() {
    if (window.CGAuth && window.CGAuth.isLoggedIn && window.CGAuth.isLoggedIn()) return window.CGAuth.displayName();
    if (!currentUser) return '';
    var m = currentUser.user_metadata || {};
    return m.nickname || m.full_name || m.name || String(currentUser.email || '').split('@')[0];
  }

  function renderAuthBox() {
    var wrap = document.querySelector('.site-header .nav-wrap');
    if (!wrap) return;
    var box = wrap.querySelector('.auth-box');
    if (!box) {
      box = document.createElement('div');
      box.className = 'auth-box';
      var toggle = wrap.querySelector('.nav-toggle');
      if (toggle) wrap.insertBefore(box, toggle);
      else wrap.appendChild(box);
    }
    if (window.CGAuth && window.CGAuth.__loaded) {
      if (!box.querySelector('.cg-auth')) box.innerHTML = '';
      window.CGAuth.mountAuthUI(box);
      return;
    }
    if (currentUser) box.innerHTML = '<a class="auth-user" href="login.html">' + esc(displayName()) + '</a>';
    else box.innerHTML = '<a class="auth-login-btn" href="login.html">🔑 로그인</a>';
  }

  async function init() {
    renderAuthBox();
    if (!sb()) return;
    try {
      var s = await sb().auth.getSession();
      if (s && s.data && s.data.session) {
        currentUser = s.data.session.user;
        var membership = await ensureMembership();
        renderAuthBox();
        await syncProgressOnLogin();
        document.dispatchEvent(new CustomEvent('science:auth-changed', { detail: { user: currentUser, membership: membership } }));
      }
    } catch (e) {}
    try {
      sb().auth.onAuthStateChange(async function (event, session) {
        if (event === 'PASSWORD_RECOVERY') return;
        var prevId = currentUser && currentUser.id;
        currentUser = session ? session.user : null;
        var membership = null;
        if (currentUser && currentUser.id !== prevId) {
          membership = await ensureMembership();
          await syncProgressOnLogin();
        }
        renderAuthBox();
        document.dispatchEvent(new CustomEvent('science:auth-changed', { detail: { user: currentUser, membership: membership } }));
      });
    } catch (e) {}
    if (window.CGAuth && window.CGAuth.onChange) {
      window.CGAuth.onChange(function (d) {
        var u = d && d.user ? d.user : null;
        if (u && (!currentUser || currentUser.id !== u.id)) {
          currentUser = u;
          ensureMembership().then(function (m) {
            syncProgressOnLogin();
            document.dispatchEvent(new CustomEvent('science:auth-changed', { detail: { user: currentUser, membership: m } }));
          });
        } else if (!u && currentUser) {
          currentUser = null;
          document.dispatchEvent(new CustomEvent('science:auth-changed', { detail: { user: null } }));
        }
        renderAuthBox();
      });
    }
  }

  window.ScienceAuth = {
    SERVICE: SERVICE,
    ADMIN_EMAILS: ADMIN_EMAILS,
    getUser: function () {
      if (window.CGAuth && window.CGAuth.getUser && window.CGAuth.getUser()) return window.CGAuth.getUser();
      return currentUser;
    },
    isLoggedIn: function () {
      if (window.CGAuth && window.CGAuth.isLoggedIn) return window.CGAuth.isLoggedIn();
      return !!currentUser;
    },
    isAdmin: function () {
      var u = this.getUser();
      if (window.CGAuth && window.CGAuth.isAdmin && window.CGAuth.isAdmin()) return true;
      return isAdmin(u);
    },
    displayName: displayName,
    signInWithGoogle: signInWithGoogle,
    signOut: signOut,
    ensureMembership: ensureMembership,
    syncProgressOnLogin: syncProgressOnLogin,
    sdb: sdb,
    pdb: pdb
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
