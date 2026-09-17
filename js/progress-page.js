/* 과학아 놀자! - progress.html 내 진도 + 오답노트 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var body = document.getElementById('progress-body');
  if (!body || !window.ScienceProgress) return;
  var D = window.SciencePlayData;
  var concepts = window.ScienceConceptData || [];
  var byId = {};
  concepts.forEach(function (c) { byId[c.id] = c; });

  function render() {
    var st = window.ScienceProgress.stats();
    var done = window.ScienceProgress.getDone();
    var wrongs = window.ScienceProgress.getWrongNotes();
    var unsolved = wrongs.filter(function (w) { return !w.solved; });
    var solved = wrongs.filter(function (w) { return w.solved; });

    body.innerHTML =
      '<div class="dash-stats">' +
      '<a class="dash-stat" href="concepts.html"><span class="ds-icon">📚</span><span class="ds-num">' + done.length + '<small>/' + concepts.length + '</small></span><span class="ds-label">학습 완료 개념</span><span class="ds-bar"><span style="width:' + Math.round(done.length / Math.max(1, concepts.length) * 100) + '%"></span></span></a>' +
      '<a class="dash-stat" href="practice.html"><span class="ds-icon">✏️</span><span class="ds-num">' + st.total + '<small>문제</small></span><span class="ds-label">푼 문제 · 정답률 ' + st.rate + '%</span><span class="ds-bar"><span style="width:' + st.rate + '%"></span></span></a>' +
      '<a class="dash-stat" href="stats.html"><span class="ds-icon">📈</span><span class="ds-num">' + st.weekCount + '<small>개</small></span><span class="ds-label">이번 주 학습</span></a>' +
      '<div class="dash-stat"><span class="ds-icon">📒</span><span class="ds-num">' + unsolved.length + '<small>개</small></span><span class="ds-label">풀어야 할 오답</span></div>' +
      '</div>' +
      '<div class="dash-grid">' +
      '<div class="dash-card"><h3>✅ 학습 완료 개념 (' + done.length + ')</h3><div>' + (done.length ? done.slice(0, 12).map(function (id) {
        var c = byId[id];
        return c ? '<a class="unit-chip" href="concept-view.html?id=' + encodeURIComponent(id) + '">✅ ' + esc(c.title) + '</a>' : '';
      }).join('') + (done.length > 12 ? '<p class="muted">외 ' + (done.length - 12) + '개</p>' : '') : '<p class="muted">아직 완료한 개념이 없어요. <a href="concepts.html">개념 보러 가기</a></p>') + '</div></div>' +
      '<div class="dash-card"><h3>🏫 학교급별 진도</h3>' + D.SCHOOL_LEVELS.map(function (s) {
        var r = st.bySchool[s.value] || { total: 0, correct: 0 };
        var pct = r.total ? Math.round(r.correct / r.total * 100) : 0;
        return '<div class="bar-row"><span class="bar-label">' + s.emoji + ' ' + s.label + '</span><div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div><span style="font-size:.85rem;">' + r.total + '문제 ' + pct + '%</span></div>';
      }).join('') + '</div>' +
      '</div>' +
      '<div class="info-box"><h3>📒 오답노트 (' + unsolved.length + '개 남음)</h3>' +
      (unsolved.length ? unsolved.slice(0, 20).map(function (w) {
        var c = w.conceptId && byId[w.conceptId];
        return '<div class="dash-hist-row" style="display:block;"><div><strong>Q. ' + esc(w.question) + '</strong><br><small>내 답: ' + esc(w.given || '(없음)') + ' → 정답: ' + esc(w.answer) + '</small><br><small class="muted">📖 ' + esc(w.explanation) + '</small></div>' +
          '<div class="detail-controls" style="justify-content:flex-start;margin:8px 0 0;">' +
          (c ? '<a class="btn btn-outline btn-sm" href="concept-view.html?id=' + encodeURIComponent(c.id) + '">개념 다시 보기</a>' : '') +
          '<button class="btn btn-primary btn-sm" data-solve="' + w.id + '">해결했어요 ✅</button>' +
          '<button class="btn btn-outline btn-sm" data-del="' + w.id + '">삭제</button></div></div>';
      }).join('') : '<p class="muted">오답이 없어요! 문제를 풀다가 틀리면 여기에 저장돼요. <a href="practice.html">문제 풀러 가기</a></p>') +
      (solved.length ? '<p class="muted">✅ 해결한 오답 ' + solved.length + '개</p>' : '') + '</div>' +
      '<div class="detail-controls"><a class="btn btn-primary btn-sm" href="practice.html">문제 더 풀기</a><a class="btn btn-secondary btn-sm" href="stats.html">통계 보기</a><a class="btn btn-outline btn-sm" href="login.html">로그인하고 기록 저장</a></div>';

    body.querySelectorAll('[data-solve]').forEach(function (b) {
      b.addEventListener('click', function () { window.ScienceProgress.markWrongSolved(b.getAttribute('data-solve'), true); render(); });
    });
    body.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (confirm('이 오답을 삭제할까요?')) { window.ScienceProgress.removeWrongNote(b.getAttribute('data-del')); render(); }
      });
    });
  }
  render();
  document.addEventListener('science:progress-synced', render);
  document.addEventListener('science:progress-changed', render);
})();
