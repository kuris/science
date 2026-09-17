/* 과학아 놀자! - stats.html 통계 표시 (CSS 막대그래프, 라이브러리 없음) */
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var box = document.getElementById('stats-body');
  if (!box || !window.ScienceProgress) return;
  var D = window.SciencePlayData;
  var st = window.ScienceProgress.stats();
  var concepts = window.ScienceConceptData || [];

  var fields = D.FIELDS.map(function (f) {
    var r = st.byField[f.value] || { total: 0, correct: 0 };
    var pct = r.total ? Math.round(r.correct / r.total * 100) : 0;
    return { label: f.emoji + ' ' + f.label, total: r.total, pct: pct, color: f.color };
  });
  var maxTotal = Math.max.apply(null, fields.map(function (f) { return f.total; }).concat([1]));

  box.innerHTML =
    '<div class="stat-grid">' +
    '<div class="stat-card"><strong>' + st.conceptsDone + '<small>/' + concepts.length + '</small></strong><span>학습 완료 개념</span></div>' +
    '<div class="stat-card"><strong>' + st.total + '</strong><span>푼 문제</span></div>' +
    '<div class="stat-card"><strong>' + st.rate + '%</strong><span>전체 정답률</span></div>' +
    '<div class="stat-card"><strong>' + st.wrongCount + '</strong><span>풀어야 할 오답</span></div>' +
    '<div class="stat-card"><strong>' + st.weekCount + '</strong><span>이번 주 학습</span></div>' +
    '</div>' +
    '<div class="info-box"><h3>📊 분야별 정답률</h3>' + fields.map(function (f) {
      return '<div class="bar-row"><span class="bar-label">' + esc(f.label) + '</span><div class="bar-track"><div class="bar-fill" style="width:' + f.pct + '%;' + (f.total === 0 ? 'background:#e5e7eb;' : '') + '"></div></div><span style="width:90px;text-align:right;font-size:.85rem;">' + f.pct + '% (' + f.total + '문제)</span></div>';
    }).join('') + '</div>' +
    '<div class="info-box"><h3>📚 분야별 학습량</h3>' + fields.map(function (f) {
      var w = Math.round(f.total / maxTotal * 100);
      return '<div class="bar-row"><span class="bar-label">' + esc(f.label) + '</span><div class="bar-track"><div class="bar-fill" style="width:' + w + '%;background:' + f.color + ';"></div></div><span style="width:60px;text-align:right;font-size:.85rem;">' + f.total + '개</span></div>';
    }).join('') + '</div>' +
    '<div class="info-box"><h3>🏅 최근 퀴즈 점수</h3>' + (st.recentQuizzes.length ? st.recentQuizzes.map(function (q) {
      return '<div class="dash-hist-row"><span>' + esc(q.quiz_type) + ' · ' + (q.total_questions || 0) + '문제</span><span class="dash-score ' + (q.score >= 70 ? 'pass' : '') + '">' + q.score + '점</span></div>';
    }).join('') : '<p class="muted">아직 퀴즈 기록이 없어요. <a href="quiz.html">퀴즈 풀러 가기</a></p>') + '</div>' +
    '<div class="detail-controls"><a class="btn btn-primary btn-sm" href="practice.html">문제 더 풀기</a><a class="btn btn-secondary btn-sm" href="progress.html">내 진도 보기</a></div>';
})();
