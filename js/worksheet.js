/* 과학아 놀자! - worksheet.html 인쇄용 학습지 로직 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var outBox = document.getElementById('sheet-output');
  if (!outBox) return;
  var D = window.SciencePlayData;
  var concepts = window.ScienceConceptData || [];

  var schoolSel = document.getElementById('ws-school');
  var fieldSel = document.getElementById('ws-field');
  var unitSel = document.getElementById('ws-unit');
  var levelSel = document.getElementById('ws-level');
  var countSel = document.getElementById('ws-count');
  var answerSel = document.getElementById('ws-answer');
  var summarySel = document.getElementById('ws-summary');

  function fillUnits() {
    var list = concepts.filter(function (c) {
      return (schoolSel.value === 'all' || c.schoolLevel === schoolSel.value) &&
             (fieldSel.value === 'all' || c.field === fieldSel.value);
    });
    var units = Array.from(new Set(list.map(function (c) { return c.unit; }))).sort();
    unitSel.innerHTML = '<option value="all">전체 단원</option>' + units.map(function (u) { return '<option>' + esc(u) + '</option>'; }).join('');
  }
  schoolSel.addEventListener('change', fillUnits);
  fieldSel.addEventListener('change', fillUnits);
  fillUnits();

  document.getElementById('ws-make').addEventListener('click', function () {
    var count = Math.min(30, Math.max(3, parseInt(countSel.value || '10', 10)));
    var list = concepts.filter(function (c) {
      return (schoolSel.value === 'all' || c.schoolLevel === schoolSel.value) &&
             (fieldSel.value === 'all' || c.field === fieldSel.value) &&
             (unitSel.value === 'all' || c.unit === unitSel.value);
    });
    if (!list.length) { alert('조건에 맞는 개념이 없어요.'); return; }
    var picked = window.ScienceGenerator.shuffle(list).slice(0, Math.min(count, list.length));
    var problems = [];
    var per = Math.max(1, Math.ceil(count / picked.length));
    picked.forEach(function (c) {
      if (problems.length >= count) return;
      window.ScienceGenerator.generateByConcept(c.id, Math.min(per, count - problems.length), levelSel.value).forEach(function (p) { problems.push(p); });
    });
    problems = problems.slice(0, count);
    var showAnswer = answerSel.value === 'yes';
    var showSummary = summarySel.value === 'yes';
    var today = new Date().toISOString().slice(0, 10);
    var html = '<div class="sheet"><h2>🔬 과학 학습지 (' + today + ')</h2>' +
      '<p class="muted">이름: ______ &nbsp; 날짜: ______ &nbsp; 점수: ______ / ' + problems.length + '</p>' +
      (showSummary ? '<div class="info-box"><h3>📌 개념 요약</h3><ul>' + picked.map(function (c) {
        return '<li><strong>' + esc(c.title) + '</strong>' + (c.formula ? ' (' + esc(c.formula) + ')' : '') + ' - ' + esc(c.shortDescription) + '<br>💡 ' + esc(c.memoryTip) + '</li>';
      }).join('') + '</ul></div>' : '') +
      '<h3>✏️ 문제</h3>' + problems.map(function (p, i) {
        return '<div class="q"><strong>' + (i + 1) + '.</strong> ' + esc(p.question) +
          (p.choices ? '<br>' + p.choices.map(function (ch, j) { return '①②③④'[j] + ' ' + esc(ch) + '&nbsp;&nbsp;'; }).join('') : '<br>답: ________') +
          (showAnswer ? '<br><small>정답: ' + esc(p.answer) + (p.unitAnswer ? ' ' + esc(p.unitAnswer) : '') + ' / ' + esc(p.explanation) + '</small>' : '') + '</div>';
      }).join('') +
      '<div class="detail-controls no-print"><button class="btn btn-primary btn-sm" onclick="window.print()">🖨️ 인쇄하기</button></div></div>';
    outBox.innerHTML = html;
    outBox.scrollIntoView({ behavior: 'smooth' });
  });
})();
