/* 과학아 놀자! - practice.html 문제 풀이 로직 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function qs(n) { try { return new URLSearchParams(location.search).get(n); } catch (e) { return null; } }
  var setupBox = document.getElementById('practice-setup');
  if (!setupBox) return;
  var playBox = document.getElementById('practice-play');
  var resultBox = document.getElementById('practice-result');
  var D = window.SciencePlayData;
  var concepts = window.ScienceConceptData || [];

  var schoolSel = document.getElementById('pr-school');
  var gradeSel = document.getElementById('pr-grade');
  var fieldSel = document.getElementById('pr-field');
  var unitSel = document.getElementById('pr-unit');
  var conceptSel = document.getElementById('pr-concept');
  var levelSel = document.getElementById('pr-level');
  var countSel = document.getElementById('pr-count');

  function fillGrades() {
    var sl = schoolSel.value;
    gradeSel.innerHTML = '<option value="all">전체 학년/과목</option>' + D.GRADE_LEVELS
      .filter(function (g) { return sl === 'all' || g.schoolLevel === sl; })
      .map(function (g) { return '<option value="' + g.value + '">' + g.label + '</option>'; }).join('');
  }
  function fillUnits() {
    var list = concepts.filter(function (c) {
      return (schoolSel.value === 'all' || c.schoolLevel === schoolSel.value) &&
             (fieldSel.value === 'all' || c.field === fieldSel.value);
    });
    var units = Array.from(new Set(list.map(function (c) { return c.unit; }))).sort();
    unitSel.innerHTML = '<option value="all">전체 단원</option>' + units.map(function (u) { return '<option>' + esc(u) + '</option>'; }).join('');
  }
  function fillConcepts() {
    var list = concepts.filter(function (c) {
      return (schoolSel.value === 'all' || c.schoolLevel === schoolSel.value) &&
             (fieldSel.value === 'all' || c.field === fieldSel.value) &&
             (unitSel.value === 'all' || c.unit === unitSel.value);
    });
    conceptSel.innerHTML = '<option value="all">전체 개념</option>' + list.map(function (c) { return '<option value="' + c.id + '">' + esc(c.title) + '</option>'; }).join('');
  }
  schoolSel.addEventListener('change', function () { fillGrades(); fillUnits(); fillConcepts(); });
  fieldSel.addEventListener('change', function () { fillUnits(); fillConcepts(); });
  unitSel.addEventListener('change', fillConcepts);
  fillGrades(); fillUnits(); fillConcepts();

  var preset = qs('concept');
  if (preset) {
    conceptSel.value = preset;
    var pc = concepts.filter(function (c) { return c.id === preset; })[0];
    if (pc) { schoolSel.value = pc.schoolLevel; fillGrades(); gradeSel.value = pc.gradeLevel; fieldSel.value = pc.field; fillUnits(); unitSel.value = pc.unit; fillConcepts(); conceptSel.value = preset; }
  }

  var queue = [], idx = 0, correct = 0, wrongList = [];
  document.getElementById('pr-start').addEventListener('click', function () {
    var count = Math.min(30, Math.max(1, parseInt(countSel.value || '10', 10)));
    var opts = { count: count, level: levelSel.value, field: fieldSel.value, schoolLevel: schoolSel.value, gradeLevel: gradeSel.value };
    if (conceptSel.value !== 'all') opts.conceptId = conceptSel.value;
    queue = window.ScienceGenerator.generateProblems(opts);
    if (!queue.length) { alert('조건에 맞는 문제가 없어요. 필터를 바꿔보세요.'); return; }
    idx = 0; correct = 0; wrongList = [];
    setupBox.style.display = 'none';
    resultBox.style.display = 'none';
    playBox.style.display = 'block';
    showQ();
  });

  function showQ() {
    var p = queue[idx];
    document.getElementById('pr-progress').textContent = (idx + 1) + ' / ' + queue.length;
    document.getElementById('pr-question').innerHTML = '<strong>Q' + (idx + 1) + '.</strong> ' + esc(p.question) + (p.unitAnswer ? ' <small>(' + esc(p.unitAnswer) + ')</small>' : '');
    var ansBox = document.getElementById('pr-answers');
    var fb = document.getElementById('pr-feedback');
    fb.style.display = 'none'; fb.className = 'feedback';
    if (p.type === 'multiple_choice' && p.choices) {
      ansBox.innerHTML = p.choices.map(function (ch) { return '<button class="opt-btn" data-a="' + esc(ch) + '">' + esc(ch) + '</button>'; }).join('');
      ansBox.querySelectorAll('.opt-btn').forEach(function (b) {
        b.addEventListener('click', function () { check(b.getAttribute('data-a')); });
      });
    } else {
      ansBox.innerHTML = '<input class="answer-input" id="pr-input" placeholder="답을 적어보세요"><div class="detail-controls"><button class="btn btn-primary btn-sm" id="pr-submit">정답 확인</button><button class="btn btn-outline btn-sm" id="pr-hint">힌트 보기</button></div>';
      var submit = function () { check(document.getElementById('pr-input').value); };
      document.getElementById('pr-submit').addEventListener('click', submit);
      document.getElementById('pr-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      document.getElementById('pr-hint').addEventListener('click', function () {
        fb.style.display = 'block'; fb.className = 'feedback'; fb.textContent = '💡 힌트: ' + (p.hint || '개념 페이지의 쉬운 설명을 떠올려 보세요.');
      });
    }
  }

  function norm(s) { return String(s == null ? '' : s).trim().replace(/\s+/g, '').toLowerCase(); }
  function checkAnswer(given, answer) {
    var g = norm(given), a = norm(answer);
    if (!g || !a) return false;
    if (g === a) return true;
    // 숫자 답: 정확히 일치해야 함 ("5" vs "15" 혼동 방지)
    if (/^[0-9.\-]+$/.test(a)) return g === a;
    // 단답형(≤12자): 정답 포함 또는 핵심어 포함 시 정답
    if (a.length <= 12) return g.indexOf(a) !== -1 || a.indexOf(g) !== -1;
    // 긴 서술형은 원칙적으로 출제하지 않지만, 혹시 나오면 핵심어 매칭
    var keys = a.replace(/[은는이가을를의에]/g, ' ').split(/[\s,·\-~()]+/).filter(function (w) { return w.length >= 2; });
    var hit = keys.filter(function (w) { return g.indexOf(w) !== -1; }).length;
    return hit >= 2 && hit / keys.length >= 0.5;
  }
  function check(given) {
    var p = queue[idx];
    var ok = checkAnswer(given, p.answer);
    var g = norm(given), a = norm(p.answer);
    var ansBox = document.getElementById('pr-answers');
    var fb = document.getElementById('pr-feedback');
    ansBox.querySelectorAll('.opt-btn').forEach(function (b) {
      b.disabled = true;
      if (norm(b.getAttribute('data-a')) === a) b.classList.add('correct');
      else if (b.getAttribute('data-a') === given) b.classList.add('wrong');
    });
    var input = document.getElementById('pr-input');
    if (input) input.disabled = true;
    var oldBtn = document.getElementById('pr-submit');
    if (oldBtn) oldBtn.disabled = true;
    fb.style.display = 'block';
    if (ok) {
      correct++;
      fb.className = 'feedback ok';
      fb.innerHTML = esc(D.PRAISE[Math.floor(Math.random() * D.PRAISE.length)]) + '<br>📖 ' + esc(p.explanation);
    } else {
      fb.className = 'feedback no';
      fb.innerHTML = esc(D.COMFORT[Math.floor(Math.random() * D.COMFORT.length)]) + '<br>정답: <strong>' + esc(p.answer) + '</strong>' + (p.unitAnswer ? ' ' + esc(p.unitAnswer) : '') + '<br>📖 ' + esc(p.explanation);
      wrongList.push({ problem: p, given: given });
      if (window.ScienceProgress) window.ScienceProgress.addWrongNote(p, given);
    }
    if (window.ScienceProgress) window.ScienceProgress.recordAttempt(p.conceptId, ok, p);
    var nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary btn-sm';
    nextBtn.style.marginTop = '10px';
    nextBtn.textContent = idx + 1 < queue.length ? '다음 문제 →' : '결과 보기';
    nextBtn.addEventListener('click', function () {
      idx++;
      if (idx < queue.length) showQ();
      else showResult();
    });
    fb.appendChild(document.createElement('br'));
    fb.appendChild(nextBtn);
    nextBtn.focus();
  }

  function showResult() {
    playBox.style.display = 'none';
    resultBox.style.display = 'block';
    var pct = Math.round(correct / queue.length * 100);
    resultBox.innerHTML = '<h3>🎉 ' + queue.length + '문제 중 ' + correct + '개 정답! (' + pct + '점)</h3>' +
      '<p class="muted">' + (pct >= 80 ? '개념 마스터에 가까워졌어요!' : pct >= 60 ? '잘하고 있어요. 오답을 다시 확인해 보세요.' : '괜찮아요. 개념부터 다시 천천히 볼까요?') + '</p>' +
      (wrongList.length ? '<div class="warn-box"><strong>📒 오답 ' + wrongList.length + '개가 오답노트에 저장됐어요.</strong><ul>' +
        wrongList.slice(0, 5).map(function (w) { return '<li>' + esc(w.problem.question) + ' → 정답: ' + esc(w.problem.answer) + '</li>'; }).join('') + '</ul></div>' : '<div class="tip-box">💡 전부 맞혔어요! 다음 단원에 도전해 보세요.</div>') +
      '<div class="detail-controls"><button class="btn btn-primary btn-sm" id="pr-retry">다시 풀기</button><a class="btn btn-secondary btn-sm" href="progress.html">오답노트 보기</a><button class="btn btn-outline btn-sm" id="pr-back">조건 바꾸기</button></div>';
    document.getElementById('pr-retry').addEventListener('click', function () {
      idx = 0; correct = 0; wrongList = [];
      resultBox.style.display = 'none'; playBox.style.display = 'block'; showQ();
    });
    document.getElementById('pr-back').addEventListener('click', function () {
      resultBox.style.display = 'none'; setupBox.style.display = 'block';
    });
  }
})();
