/* 과학아 놀자! - experiment.html 로직 (안전 문구 포함) */
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function qs(n) { try { return new URLSearchParams(location.search).get(n); } catch (e) { return null; } }
  var listBox = document.getElementById('exp-list');
  if (!listBox) return;
  var detailBox = document.getElementById('exp-detail');
  var D = window.SciencePlayData;
  var exps = window.ScienceExperimentData || [];
  var concepts = window.ScienceConceptData || [];
  var byId = {};
  concepts.forEach(function (c) { byId[c.id] = c; });

  var schoolSel = document.getElementById('ex-school');
  var fieldSel = document.getElementById('ex-field');
  var searchInput = document.getElementById('ex-search');

  function renderList() {
    var sl = schoolSel.value, fd = fieldSel.value, q = (searchInput.value || '').trim().toLowerCase();
    var list = exps.filter(function (e) {
      if (sl !== 'all' && e.schoolLevel !== sl) return false;
      if (fd !== 'all' && e.field !== fd) return false;
      if (q && (e.title + ' ' + e.unit + ' ' + e.materials.join(' ')).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    document.getElementById('exp-count').textContent = '총 ' + list.length + '개 활동 (모두 안전한 관찰 활동이에요)';
    listBox.innerHTML = list.map(function (e) {
      return '<div class="concept-card" style="border-top-color:' + D.fieldColor(e.field) + '">' +
        '<div class="tag-row"><span class="tag" style="background:' + D.schoolColor(e.schoolLevel) + '22;color:' + D.schoolColor(e.schoolLevel) + '">' + esc(D.schoolLabel(e.schoolLevel)) + '</span>' +
        '<span class="tag">✅ 안전</span><span class="tag">⏱️ ' + e.timeMinutes + '분</span></div>' +
        '<h3>🧪 ' + esc(e.title) + '</h3><p class="muted" style="margin:0;">준비물: ' + esc(e.materials.slice(0, 4).join(', ')) + '</p>' +
        '<div class="card-actions"><button class="btn btn-primary btn-sm" data-exp="' + e.id + '">방법 보기</button></div></div>';
    }).join('') || '<p class="muted">조건에 맞는 활동이 없어요.</p>';
    listBox.querySelectorAll('[data-exp]').forEach(function (b) {
      b.addEventListener('click', function () { showDetail(b.getAttribute('data-exp')); });
    });
  }
  schoolSel.addEventListener('change', renderList);
  fieldSel.addEventListener('change', renderList);
  searchInput.addEventListener('input', renderList);

  function showDetail(id) {
    var e = exps.filter(function (x) { return x.id === id; })[0];
    if (!e) return;
    var rel = (e.relatedConceptIds || []).map(function (r) { return byId[r]; }).filter(Boolean);
    detailBox.style.display = 'block';
    detailBox.innerHTML =
      '<h2 style="margin-top:0;">🧪 ' + esc(e.title) + '</h2>' +
      '<div class="tag-row"><span class="tag">' + esc(D.schoolLabel(e.schoolLevel)) + ' ' + esc(D.gradeLabel(e.gradeLevel)) + '</span><span class="tag">' + esc(D.fieldLabel(e.field)) + ' · ' + esc(e.unit) + '</span><span class="tag">✅ 안전</span><span class="tag">⏱️ ' + e.timeMinutes + '분</span></div>' +
      '<div class="warn-box"><strong>⚠️ 안전 약속</strong><ul><li>반드시 보호자나 선생님과 함께 해요.</li>' + e.caution.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="info-box"><h3>🎒 준비물</h3><ul>' + e.materials.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="info-box"><h3>📝 방법</h3><ol class="step-list">' + e.steps.map(function (s, i) { return '<li><strong>' + (i + 1) + '단계.</strong> ' + esc(s) + '</li>'; }).join('') + '</ol></div>' +
      '<div class="check-box"><strong>👀 관찰 포인트</strong><ul>' + e.observationPoints.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="life-box"><h3 style="margin-top:0;">💡 왜 그런 걸까?</h3><p style="margin:0;">' + esc(e.why) + '</p></div>' +
      (rel.length ? '<div class="info-box"><h3>🔗 연결된 개념</h3><p>' + rel.map(function (r) { return '<a class="unit-chip" href="concept-view.html?id=' + encodeURIComponent(r.id) + '">' + esc(r.title) + '</a>'; }).join('') + '</p></div>' : '') +
      '<div class="info-box"><h3>📓 관찰 기록</h3><textarea class="answer-input" id="exp-note" rows="3" placeholder="관찰한 것을 적어보세요 (예: 그림자 길이가 오전보다 짧아졌어요)"></textarea>' +
      '<div class="detail-controls"><button class="btn btn-primary btn-sm" id="exp-save">관찰 기록 저장</button></div><div class="feedback" id="exp-saved" style="display:none;"></div></div>' +
      '<div class="detail-controls"><button class="btn btn-outline btn-sm" id="exp-close">닫기</button></div>';
    detailBox.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('exp-close').addEventListener('click', function () { detailBox.style.display = 'none'; });
    document.getElementById('exp-save').addEventListener('click', function () {
      var note = document.getElementById('exp-note').value.trim();
      if (!note) { alert('관찰한 것을 먼저 적어주세요.'); return; }
      if (window.ScienceProgress) window.ScienceProgress.saveExperimentLog(e.id, note);
      var fb = document.getElementById('exp-saved');
      fb.style.display = 'block'; fb.className = 'feedback ok';
      fb.textContent = '멋져요! 과학자의 눈으로 잘 관찰했어요. 🔬 기록이 저장됐어요.';
    });
  }

  renderList();
  var preset = qs('id');
  if (preset) showDetail(preset);
})();
