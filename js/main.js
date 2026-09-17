/* 과학아 놀자! - index.html 메인 로직 */
document.addEventListener('DOMContentLoaded', function () {
  var D = window.SciencePlayData;
  var concepts = window.ScienceConceptData || [];
  var problems = window.ScienceProblemData || [];
  var experiments = window.ScienceExperimentData || [];

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function pick(arr, n, seed) {
    var a = arr.slice();
    var x = seed || 7;
    function rnd() { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a.slice(0, n);
  }
  function daySeed() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  // 오늘의 개념
  var todayBox = document.getElementById('today-concept');
  if (todayBox && concepts.length) {
    var c = pick(concepts, 1, daySeed())[0];
    todayBox.innerHTML =
      '<div class="today-card"><div class="today-emoji">🔬</div>' +
      '<div class="today-body"><span class="tag" style="background:' + D.fieldColor(c.field) + '22;color:' + D.fieldColor(c.field) + '">' + esc(D.fieldLabel(c.field)) + ' · ' + esc(D.schoolLabel(c.schoolLevel)) + '</span>' +
      '<h3>' + esc(c.title) + '</h3><p>' + esc(c.shortDescription) + '</p>' +
      '<div class="tip-box">💡 외우는 꿀팁: ' + esc(c.memoryTip) + '</div>' +
      '<div class="today-actions"><a class="btn btn-primary btn-sm" href="concept-view.html?id=' + encodeURIComponent(c.id) + '">자세히 보기</a> ' +
      '<a class="btn btn-secondary btn-sm" href="practice.html?concept=' + encodeURIComponent(c.id) + '">문제 풀기</a></div></div></div>';
  }

  // 오늘의 5문제
  var todayQ = document.getElementById('today-quiz');
  if (todayQ && problems.length) {
    var five = pick(problems, 5, daySeed());
    todayQ.innerHTML = five.map(function (p, i) {
      var concept = concepts.filter(function (x) { return x.id === p.conceptId; })[0];
      return '<a class="mini-q" href="practice.html?concept=' + encodeURIComponent(p.conceptId) + '">' +
        '<span class="mini-q-num">Q' + (i + 1) + '</span>' +
        '<span class="mini-q-body"><strong>' + esc(p.question.length > 42 ? p.question.slice(0, 42) + '…' : p.question) + '</strong>' +
        '<small>' + esc(concept ? concept.title : p.unit) + ' · ' + esc(D.levelLabel(p.level)) + '</small></span><span class="mini-q-go">→</span></a>';
    }).join('') + '<div class="detail-controls"><a class="btn btn-outline btn-sm" href="quiz.html">오늘의 5문제 풀기</a></div>';
  }

  // 오늘의 실험/관찰 추천
  var todayExp = document.getElementById('today-experiment');
  if (todayExp && experiments.length) {
    var e = pick(experiments, 1, daySeed() + 2)[0];
    todayExp.innerHTML =
      '<a class="exp-pick" href="experiment.html?id=' + encodeURIComponent(e.id) + '">' +
      '<span class="exp-pick-emoji">🧪</span>' +
      '<span class="mini-q-body"><strong>직접 관찰해 볼까? ' + esc(e.title) + '</strong>' +
      '<small>⏱️ ' + e.timeMinutes + '분 · ✅ 안전한 활동 · ' + esc(D.schoolLabel(e.schoolLevel)) + '</small></span><span class="mini-q-go">→</span></a>';
  }

  // 암기 꿀팁
  var tipsBox = document.getElementById('memory-tips');
  if (tipsBox && concepts.length) {
    var tips = pick(concepts, 3, daySeed() + 1);
    tipsBox.innerHTML = tips.map(function (x) {
      return '<div class="tip-card"><span class="tag" style="background:' + D.fieldColor(x.field) + '22;color:' + D.fieldColor(x.field) + '">' + esc(x.title) + '</span><p>💡 ' + esc(x.memoryTip) + '</p></div>';
    }).join('');
  }

  // 인기 단원
  var unitsBox = document.getElementById('popular-units');
  if (unitsBox && concepts.length) {
    var counts = {};
    concepts.forEach(function (x) { counts[x.unit] = (counts[x.unit] || 0) + 1; });
    var units = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 8);
    unitsBox.innerHTML = units.map(function (u) {
      return '<a class="unit-chip" href="concepts.html?q=' + encodeURIComponent(u) + '">📦 ' + esc(u) + ' <small>' + counts[u] + '개념</small></a>';
    }).join('');
  }

  // 최근 학습 기록 (localStorage)
  var recentBox = document.getElementById('recent-study');
  if (recentBox) {
    try {
      var log = JSON.parse(localStorage.getItem('science_study_log') || '[]').slice(0, 4);
      if (!log.length) recentBox.innerHTML = '<p class="muted">아직 학습 기록이 없어요. 개념 하나부터 시작해 볼까요? 🌱</p>';
      else recentBox.innerHTML = log.map(function (r) {
        return '<div class="recent-row"><span>' + esc(r.title || r.id) + '</span><small>' + esc(r.at ? String(r.at).slice(5, 16).replace('T', ' ') : '') + '</small></div>';
      }).join('');
    } catch (e) { recentBox.innerHTML = ''; }
  }

  // 카운터
  var counters = document.getElementById('service-counters');
  if (counters) {
    counters.innerHTML =
      '<div class="counter"><strong>' + concepts.length + '</strong><span>개념·공식</span></div>' +
      '<div class="counter"><strong>' + problems.length + '</strong><span>연습 문제</span></div>' +
      '<div class="counter"><strong>' + experiments.length + '</strong><span>안전 실험</span></div>';
  }
});
