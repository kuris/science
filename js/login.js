/* 과학아 놀자! - login.html Google 로그인 + 대시보드 (playhanja login.js 참고) */
document.addEventListener('DOMContentLoaded', function () {
  var AUTH = window.ScienceAuth;
  var msgBox = document.getElementById('auth-msg');
  var authView = document.getElementById('auth-view');
  var dashView = document.getElementById('dash-view');

  function showMsg(text, type) {
    if (!msgBox) return;
    msgBox.className = 'auth-msg show ' + (type || 'info');
    msgBox.innerHTML = text;
  }

  var googleBtn = document.getElementById('google-login-btn');
  if (googleBtn) googleBtn.addEventListener('click', async function () {
    try {
      showMsg('구글 로그인 창으로 이동할게요...', 'info');
      await AUTH.signInWithGoogle();
    } catch (err) {
      showMsg('문제가 생겼어요: ' + esc((err && err.message) || '알 수 없는 오류'), 'error');
    }
  });
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', async function () {
    await AUTH.signOut();
    location.reload();
  });

  function renderDashboard() {
    if (!window.ScienceProgress) return;
    var st = window.ScienceProgress.stats();
    authView.style.display = 'none';
    dashView.style.display = 'block';
    document.getElementById('dash-greeting').textContent = AUTH.displayName() + '님, 반가워요! 👋';
    document.getElementById('dash-stats').innerHTML =
      '<a class="dash-stat" href="concepts.html"><span class="ds-icon">📚</span><span class="ds-num">' + st.conceptsDone + '</span><span class="ds-label">학습 완료 개념</span></a>' +
      '<a class="dash-stat" href="practice.html"><span class="ds-icon">✏️</span><span class="ds-num">' + st.total + '</span><span class="ds-label">푼 문제 · ' + st.rate + '%</span></a>' +
      '<a class="dash-stat" href="progress.html"><span class="ds-icon">📒</span><span class="ds-num">' + st.wrongCount + '</span><span class="ds-label">풀어야 할 오답</span></a>' +
      '<a class="dash-stat" href="stats.html"><span class="ds-icon">📈</span><span class="ds-num">' + st.weekCount + '</span><span class="ds-label">이번 주 학습</span></a>';
    var hist = document.getElementById('dash-history');
    hist.innerHTML = st.quizzes.length ? st.quizzes.slice(0, 8).map(function (q) {
      return '<div class="dash-hist-row"><span>' + esc(q.quiz_type) + ' · ' + q.total_questions + '문제</span><span class="dash-score ' + (q.score >= 70 ? 'pass' : '') + '">' + q.correct_count + '/' + q.total_questions + ' · ' + q.score + '점</span></div>';
    }).join('') : '<p class="muted">아직 퀴즈 기록이 없어요.</p>';
  }

  document.addEventListener('science:auth-changed', function (e) {
    if (e.detail && e.detail.user) {
      var w = document.getElementById('service-welcome');
      if (w && e.detail.membership && e.detail.membership.isNew) {
        w.style.display = 'block';
        w.innerHTML = '🎉 <strong>과학아 놀자에 오신 걸 환영해요!</strong> 기존 계정으로 바로 시작했어요. 학습 기록은 이 서비스에만 저장되니 안심하세요.';
      }
      renderDashboard();
    } else { authView.style.display = 'block'; dashView.style.display = 'none'; }
  });
  document.addEventListener('science:progress-synced', function () {
    if (AUTH.isLoggedIn()) renderDashboard();
  });
  if (AUTH && AUTH.isLoggedIn()) renderDashboard();
});
