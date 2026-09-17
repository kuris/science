/* 과학아 놀자! - quiz.html 퀴즈 로직 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var setupBox = document.getElementById('quiz-setup');
  if (!setupBox) return;
  var playBox = document.getElementById('quiz-play');
  var resultBox = document.getElementById('quiz-result');
  var D = window.SciencePlayData;
  var queue = [], idx = 0, correct = 0, answers = [], startTime = 0, timer = null, remain = 0;

  var typeSel = document.getElementById('qz-type');
  var schoolSel = document.getElementById('qz-school');
  var countSel = document.getElementById('qz-count');
  var timeSel = document.getElementById('qz-time');

  document.getElementById('qz-start').addEventListener('click', function () {
    var count = Math.min(20, Math.max(3, parseInt(countSel.value || '10', 10)));
    var type = typeSel.value;
    var opts = { count: count, level: 'all' };
    if (type === 'concept') opts.field = 'all';
    else if (type === 'formula') {
      queue = [];
      var gens = [window.ScienceGenerator.generateSpeedProblem, window.ScienceGenerator.generateDensityProblem, window.ScienceGenerator.generateOhmLawProblem, window.ScienceGenerator.generateMoleProblem];
      for (var i = 0; i < count; i++) queue.push(gens[i % gens.length]());
    } else if (type === 'experiment') {
      var exps = window.ScienceExperimentData || [];
      var concepts = window.ScienceConceptData || [];
      queue = window.ScienceGenerator.shuffle(exps).slice(0, count).map(function (e, i) {
        var others = window.ScienceGenerator.shuffle(exps.filter(function (x) { return x.id !== e.id; })).slice(0, 3).map(function (x) { return x.title; });
        return {
          id: 'quiz_exp_' + i, conceptId: (e.relatedConceptIds || [])[0] || null,
          schoolLevel: e.schoolLevel, gradeLevel: e.gradeLevel, field: e.field, unit: e.unit,
          level: 'normal', type: 'multiple_choice',
          question: '다음 준비물과 방법이 설명하는 관찰 활동은 무엇인가요? (준비물: ' + e.materials.slice(0, 3).join(', ') + ' / ' + e.steps[0] + ')',
          choices: window.ScienceGenerator.shuffle([e.title].concat(others)),
          answer: e.title, unitAnswer: null,
          explanation: e.title + ': ' + e.why,
          hint: '실험 페이지에서 관찰 포인트를 확인해 보세요.'
        };
      });
    } else if (type === 'mixed') {
      opts.schoolLevel = schoolSel.value;
    }
    if (type === 'concept' || type === 'mixed') {
      opts.schoolLevel = schoolSel.value;
      queue = window.ScienceGenerator.generateProblems(opts);
    }
    if (!queue.length) { alert('퀴즈 문제를 만들지 못했어요.'); return; }
    idx = 0; correct = 0; answers = [];
    startTime = Date.now();
    setupBox.style.display = 'none';
    resultBox.style.display = 'none';
    playBox.style.display = 'block';
    var t = parseInt(timeSel.value || '0', 10);
    var timeBox = document.getElementById('qz-timer');
    if (timer) clearInterval(timer);
    if (t > 0) {
      remain = t;
      timeBox.style.display = 'block';
      var tick = function () {
        timeBox.textContent = '⏱️ 남은 시간 ' + remain + '초';
        if (remain <= 0) { clearInterval(timer); finish(); return; }
        remain--;
      };
      tick();
      timer = setInterval(tick, 1000);
    } else timeBox.style.display = 'none';
    showQ();
  });

  function showQ() {
    var p = queue[idx];
    document.getElementById('qz-progress').textContent = (idx + 1) + ' / ' + queue.length;
    document.getElementById('qz-question').innerHTML = '<strong>Q' + (idx + 1) + '.</strong> ' + esc(p.question);
    var ansBox = document.getElementById('qz-answers');
    var fb = document.getElementById('qz-feedback');
    fb.style.display = 'none';
    ansBox.innerHTML = p.choices.map(function (ch) { return '<button class="opt-btn" data-a="' + esc(ch) + '">' + esc(ch) + '</button>'; }).join('');
    ansBox.querySelectorAll('.opt-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var ok = b.getAttribute('data-a') === p.answer;
        answers.push({ problem: p, given: b.getAttribute('data-a'), ok: ok });
        if (ok) correct++;
        else if (window.ScienceProgress) window.ScienceProgress.addWrongNote(p, b.getAttribute('data-a'));
        if (window.ScienceProgress) window.ScienceProgress.recordAttempt(p.conceptId, ok, p);
        idx++;
        if (idx < queue.length) showQ();
        else finish();
      });
    });
  }

  function finish() {
    if (timer) clearInterval(timer);
    playBox.style.display = 'none';
    resultBox.style.display = 'block';
    var secs = Math.round((Date.now() - startTime) / 1000);
    var score = Math.round(correct / queue.length * 100);
    var wrong = answers.filter(function (a) { return !a.ok; });
    resultBox.innerHTML = '<h3>📊 퀴즈 결과: ' + score + '점 (' + correct + '/' + queue.length + ')</h3>' +
      '<p class="muted">⏱️ 걸린 시간 약 ' + secs + '초 · ' + (score >= 80 ? '개념 마스터에 가까워졌어요! 🏅' : score >= 60 ? '잘하고 있어요!' : '실수는 발견의 시작이에요. 🔍') + '</p>' +
      (wrong.length ? '<div class="warn-box"><strong>틀린 문제 ' + wrong.length + '개 (오답노트 저장됨)</strong><ul>' +
        wrong.slice(0, 8).map(function (w) { return '<li>' + esc(w.problem.question) + '<br>→ 정답: ' + esc(w.problem.answer) + ' / 내 답: ' + esc(w.given) + '</li>'; }).join('') + '</ul></div>' : '<div class="tip-box">💡 만점이에요! 정말 대단해요!</div>') +
      '<div class="detail-controls"><button class="btn btn-primary btn-sm" id="qz-retry">다시 풀기</button><a class="btn btn-secondary btn-sm" href="progress.html">오답노트 보기</a><button class="btn btn-outline btn-sm" id="qz-back">설정으로</button></div>';
    if (window.ScienceProgress) {
      window.ScienceProgress.saveQuizResult({
        quiz_type: typeSel.value, school_level: schoolSel.value, total_questions: queue.length,
        correct_count: correct, score: score, duration_seconds: secs,
        result_data: answers.slice(0, 20).map(function (a) { return { q: a.problem.question, ok: a.ok }; })
      });
    }
    document.getElementById('qz-retry').addEventListener('click', function () { location.reload(); });
    document.getElementById('qz-back').addEventListener('click', function () {
      resultBox.style.display = 'none'; setupBox.style.display = 'block';
    });
  }
})();
