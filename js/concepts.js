/* 과학아 놀자! - concepts.html + concept-view.html 로직 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function qs(name) {
    try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; }
  }
  var D = window.SciencePlayData;
  var concepts = window.ScienceConceptData || [];
  var problems = window.ScienceProblemData || [];
  var experiments = window.ScienceExperimentData || [];
  var byId = {};
  concepts.forEach(function (c) { byId[c.id] = c; });

  // ---------- 목록 페이지 ----------
  var grid = document.getElementById('concept-grid');
  if (grid) {
    var schoolTabs = document.querySelectorAll('[data-school-tab]');
    var fieldBox = document.getElementById('field-filter');
    var unitSel = document.getElementById('unit-filter');
    var searchInput = document.getElementById('concept-search');
    var countBox = document.getElementById('concept-count');
    var state = { school: qs('school') || 'all', field: 'all', unit: 'all', q: qs('q') || '' };
    if (searchInput && state.q) searchInput.value = state.q;

    if (fieldBox) {
      fieldBox.innerHTML = '<button class="chip active" data-field="all">전체 분야</button>' +
        D.FIELDS.map(function (f) { return '<button class="chip" data-field="' + f.value + '">' + f.emoji + ' ' + f.label + '</button>'; }).join('');
      fieldBox.addEventListener('click', function (e) {
        var b = e.target.closest('[data-field]');
        if (!b) return;
        state.field = b.getAttribute('data-field');
        fieldBox.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('active', x === b); });
        render();
      });
    }
    function refreshUnits() {
      if (!unitSel) return;
      var list = concepts.filter(function (c) {
        return (state.school === 'all' || c.schoolLevel === state.school) && (state.field === 'all' || c.field === state.field);
      });
      var units = Array.from(new Set(list.map(function (c) { return c.unit; }))).sort();
      unitSel.innerHTML = '<option value="all">전체 단원</option>' + units.map(function (u) { return '<option value="' + esc(u) + '">' + esc(u) + '</option>'; }).join('');
      state.unit = 'all';
    }
    if (schoolTabs) schoolTabs.forEach(function (t) {
      if (t.getAttribute('data-school-tab') === state.school) t.classList.add('active');
      t.addEventListener('click', function () {
        state.school = t.getAttribute('data-school-tab');
        schoolTabs.forEach(function (x) { x.classList.toggle('active', x === t); });
        refreshUnits();
        render();
      });
    });
    if (unitSel) unitSel.addEventListener('change', function () { state.unit = unitSel.value; render(); });
    if (searchInput) searchInput.addEventListener('input', function () { state.q = searchInput.value.trim(); render(); });
    refreshUnits();

    function render() {
      var q = state.q.toLowerCase();
      var list = concepts.filter(function (c) {
        if (state.school !== 'all' && c.schoolLevel !== state.school) return false;
        if (state.field !== 'all' && c.field !== state.field) return false;
        if (state.unit !== 'all' && c.unit !== state.unit) return false;
        if (q && (c.title + ' ' + c.unit + ' ' + c.shortDescription + ' ' + (c.formula || '')).toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
      if (countBox) countBox.textContent = '총 ' + list.length + '개 개념';
      grid.innerHTML = list.length ? list.map(function (c) {
        return '<div class="concept-card" style="border-top-color:' + D.fieldColor(c.field) + '">' +
          '<div class="tag-row"><span class="tag" style="background:' + D.schoolColor(c.schoolLevel) + '22;color:' + D.schoolColor(c.schoolLevel) + '">' + esc(D.schoolLabel(c.schoolLevel)) + ' ' + esc(D.gradeLabel(c.gradeLevel)) + '</span>' +
          '<span class="tag" style="background:' + D.fieldColor(c.field) + '22;color:' + D.fieldColor(c.field) + '">' + esc(D.fieldLabel(c.field)) + '</span>' +
          (c.type === 'formula' ? '<span class="tag">공식</span>' : '') + '</div>' +
          '<h3>' + esc(c.title) + '</h3>' +
          (c.formula ? '<div class="formula-line">📐 ' + esc(c.formula) + '</div>' : '') +
          '<p class="muted" style="margin:0;">' + esc(c.shortDescription) + '</p>' +
          '<p style="margin:0;font-size:.88rem;">💡 ' + esc(c.memoryTip) + '</p>' +
          '<div class="card-actions"><a class="btn btn-primary btn-sm" href="concept-view.html?id=' + encodeURIComponent(c.id) + '">자세히 보기</a>' +
          '<a class="btn btn-secondary btn-sm" href="practice.html?concept=' + encodeURIComponent(c.id) + '">문제 풀기</a></div></div>';
      }).join('') : '<p class="muted">조건에 맞는 개념이 없어요. 검색어나 필터를 바꿔보세요.</p>';
    }
    render();
  }

  // ---------- 상세 페이지 ----------
  var detail = document.getElementById('concept-detail');
  if (detail) {
    var id = qs('id');
    var c = id && byId[id];
    if (!c) {
      detail.innerHTML = '<div class="info-box"><h3>개념을 찾지 못했어요 😢</h3><p class="muted">주소가 올바른지 확인하거나 목록에서 골라주세요.</p><div class="detail-controls"><a class="btn btn-primary" href="concepts.html">개념 목록으로</a></div></div>';
      return;
    }
    var rel = (c.relatedConceptIds || []).map(function (r) { return byId[r]; }).filter(Boolean);
    var relExp = experiments.filter(function (e) { return (e.relatedConceptIds || []).indexOf(c.id) !== -1; }).slice(0, 3);
    var relProblems = problems.filter(function (p) { return p.conceptId === c.id; }).slice(0, 3);
    var done = window.ScienceProgress ? window.ScienceProgress.isConceptDone(c.id) : false;

    detail.innerHTML =
      '<div class="tag-row"><span class="tag" style="background:' + D.schoolColor(c.schoolLevel) + '22;color:' + D.schoolColor(c.schoolLevel) + '">' + esc(D.schoolLabel(c.schoolLevel)) + ' ' + esc(D.gradeLabel(c.gradeLevel)) + '</span>' +
      '<span class="tag" style="background:' + D.fieldColor(c.field) + '22;color:' + D.fieldColor(c.field) + '">' + esc(D.fieldLabel(c.field)) + ' · ' + esc(c.unit) + '</span></div>' +
      '<h1 style="margin:10px 0;">' + esc(c.title) + '</h1>' +
      (c.formula ? '<div class="formula-hero">📐 ' + esc(c.formula) + '</div>' : '<div class="formula-hero" style="font-size:1.1rem;">📌 ' + esc(c.shortDescription) + '</div>') +
      '<div class="info-box"><h3>🗓️ 이럴 때 써요!</h3><p>' + esc(c.useWhen) + '</p></div>' +
      '<div class="info-box"><h3>📖 쉽게 말하면?</h3><p>' + esc(c.easyExplanation) + '</p></div>' +
      '<div class="life-box"><h3 style="margin-top:0;">🌳 생활 속에서 찾아볼까?</h3><p style="margin:0;">' + esc(c.funExplanation) + '</p></div>' +
      '<div class="tip-box"><strong>💡 외우는 꿀팁</strong><br>' + esc(c.memoryTip) + '</div>' +
      '<div class="info-box"><h3>📝 대표 예제</h3><p><strong>Q. ' + esc(c.example.question) + '</strong></p><ol class="step-list">' +
      c.example.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol><p><strong>정답: ' + esc(c.example.answer) + '</strong></p></div>' +
      '<div class="warn-box"><strong>⚠️ 헷갈리지 마!</strong><ul>' + c.commonMistakes.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="check-box"><strong>✏️ 한 문제만 풀어볼까?</strong><p><strong>Q. ' + esc(c.quickCheck.question) + '</strong></p>' +
      '<div style="display:flex;gap:8px;"><input class="answer-input" id="quick-answer" placeholder="답을 적어보세요"><button class="btn btn-primary btn-sm" id="quick-check-btn">확인</button></div>' +
      '<div class="feedback" id="quick-feedback" style="display:none;"></div></div>' +
      (relExp.length ? '<div class="exp-box"><strong>🔬 직접 관찰해 볼까?</strong>' + relExp.map(function (e) { return '<div><a href="experiment.html?id=' + encodeURIComponent(e.id) + '">🧪 ' + esc(e.title) + '</a></div>'; }).join('') + '</div>' : '') +
      (rel.length ? '<div class="info-box"><h3>🔗 이 개념도 같이 보면 좋아요</h3><p>' + rel.map(function (r) { return '<a class="unit-chip" href="concept-view.html?id=' + encodeURIComponent(r.id) + '">' + esc(r.title) + '</a>'; }).join('') + '</p></div>' : '') +
      '<div class="detail-controls"><a class="btn btn-secondary" href="practice.html?concept=' + encodeURIComponent(c.id) + '">문제 풀러 가기 (' + relProblems.length + ')</a>' +
      '<button class="btn ' + (done ? 'btn-outline' : 'btn-primary') + '" id="done-btn">' + (done ? '✅ 학습 완료됨 (취소하기)' : '학습 완료 체크하기') + '</button>' +
      '<a class="btn btn-outline" href="concepts.html">목록으로</a></div>';

    var qb = document.getElementById('quick-check-btn');
    if (qb) qb.addEventListener('click', function () {
      var input = document.getElementById('quick-answer');
      var fb = document.getElementById('quick-feedback');
      var v = (input.value || '').trim();
      var ok = v && c.quickCheck.answer.indexOf(v) !== -1 || v === c.quickCheck.answer;
      fb.style.display = 'block';
      if (ok) {
        var praise = D.PRAISE[Math.floor(Math.random() * D.PRAISE.length)];
        fb.className = 'feedback ok';
        fb.textContent = praise + ' 정답: ' + c.quickCheck.answer;
      } else {
        var comfort = D.COMFORT[Math.floor(Math.random() * D.COMFORT.length)];
        fb.className = 'feedback no';
        fb.textContent = comfort + ' 정답은 "' + c.quickCheck.answer + '"이에요.';
      }
      if (window.ScienceProgress) window.ScienceProgress.recordAttempt(c.id, !!ok);
    });

    var doneBtn = document.getElementById('done-btn');
    if (doneBtn) doneBtn.addEventListener('click', function () {
      if (!window.ScienceProgress) return;
      var now = window.ScienceProgress.toggleConceptDone(c.id);
      doneBtn.className = 'btn ' + (now ? 'btn-outline' : 'btn-primary');
      doneBtn.textContent = now ? '✅ 학습 완료됨 (취소하기)' : '학습 완료 체크하기';
      try {
        var log = JSON.parse(localStorage.getItem('science_study_log') || '[]');
        log.unshift({ id: c.id, title: c.title, at: new Date().toISOString() });
        localStorage.setItem('science_study_log', JSON.stringify(log.slice(0, 50)));
      } catch (e) {}
    });
  }
})();
