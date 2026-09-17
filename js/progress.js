/* ============================================================
   과학아 놀자! - 진도 저장 (localStorage + Supabase 병합)
   - 비로그인: localStorage만 사용
   - 로그인: Supabase science 스키마에 저장 + 로그인 시 병합
   - playhanja progress.js/auth.js 패턴 참고
   ============================================================ */
(function () {
  var D = window.SciencePlayData;
  var LS = {
    concept: 'science_concept_progress',
    practice: 'science_practice_progress',
    quiz: 'science_quiz_results',
    wrong: 'science_wrong_notes',
    exp: 'science_experiment_log',
    settings: 'science_settings',
    session: 'science_last_session'
  };
  function read(key, fb) {
    try {
      var v = JSON.parse(localStorage.getItem(key) || 'null');
      return v == null ? fb : v;
    } catch (e) { return fb; }
  }
  function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function valid(v, list) { return list.indexOf(v) !== -1 ? v : null; }
  function sanitizeAttempt(conceptId, ok, p) {
    var concepts = window.ScienceConceptData || [];
    var c = concepts.filter(function (x) { return x.id === conceptId; })[0];
    return {
      conceptId: String(conceptId || '').slice(0, 80),
      schoolLevel: c ? c.schoolLevel : (p ? valid(p.schoolLevel, D.ALLOWED.schoolLevel) : null),
      gradeLevel: c ? c.gradeLevel : null,
      field: c ? c.field : (p ? valid(p.field, D.ALLOWED.field) : null),
      unit: c ? c.unit : null,
      ok: !!ok,
      at: new Date().toISOString()
    };
  }
  function loggedIn() { return !!(window.ScienceAuth && window.ScienceAuth.isLoggedIn()); }
  function userId() { var u = window.ScienceAuth && window.ScienceAuth.getUser(); return u ? u.id : null; }
  function sdb() { return window.scienceDb ? window.scienceDb() : null; }

  // ---------- 개념 완료 ----------
  function getDone() { return read(LS.concept, []); }
  function isConceptDone(id) { return getDone().indexOf(id) !== -1; }
  function toggleConceptDone(id) {
    var list = getDone();
    var has = list.indexOf(id) !== -1;
    if (has) list = list.filter(function (x) { return x !== id; });
    else list.push(id);
    write(LS.concept, list);
    if (loggedIn()) upsertConceptProgress(id, !has).then(function () {}, function () {});
    document.dispatchEvent(new CustomEvent('science:progress-changed', { detail: { id: id, done: !has } }));
    return !has;
  }
  async function upsertConceptProgress(id, mastered) {
    var db = sdb(), uid = userId();
    if (!db || !uid) return false;
    try {
      var concepts = window.ScienceConceptData || [];
      var c = concepts.filter(function (x) { return x.id === id; })[0] || {};
      await db.from('concept_progress').upsert({
        user_id: uid, concept_id: String(id).slice(0, 80),
        school_level: c.schoolLevel || null, grade_level: c.gradeLevel || null,
        field: c.field || null, unit: c.unit || null,
        mastered: !!mastered, last_viewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,concept_id' });
      return true;
    } catch (e) { return false; }
  }

  // ---------- 문제 풀이 기록 ----------
  function recordAttempt(conceptId, ok, p) {
    var rec = sanitizeAttempt(conceptId, ok, p);
    var log = read(LS.session, []);
    log.unshift(rec);
    write(LS.session, log.slice(0, 200));
    var key = (rec.schoolLevel || 'all') + '|' + (rec.field || 'all') + '|' + (rec.unit || 'all');
    var agg = read(LS.practice, {});
    var a = agg[key] || { total: 0, correct: 0, streak: 0, best: 0 };
    a.total++; if (ok) { a.correct++; a.streak++; a.best = Math.max(a.best, a.streak); } else a.streak = 0;
    agg[key] = a;
    write(LS.practice, agg);
    if (loggedIn()) {
      saveStudyLog({ activity_type: 'practice', school_level: rec.schoolLevel, grade_level: rec.gradeLevel, field: rec.field, unit: rec.unit, concept_id: rec.conceptId, count_total: 1, count_correct: ok ? 1 : 0 }).then(function () {}, function () {});
      upsertPracticeProgress(rec.schoolLevel, rec.field, rec.unit, ok).then(function () {}, function () {});
      if (conceptId) upsertConceptProgress(conceptId, false).then(function () {}, function () {});
    }
    document.dispatchEvent(new CustomEvent('science:progress-changed', { detail: rec }));
  }
  async function upsertPracticeProgress(schoolLevel, field, unit, ok) {
    var db = sdb(), uid = userId();
    if (!db || !uid) return false;
    try {
      var r = await db.from('practice_progress')
        .select('*').eq('user_id', uid).eq('field', field || 'integrated').eq('level', 'normal')
        .maybeSingle();
      var row = (r && r.data) || { total_count: 0, correct_count: 0, wrong_count: 0, streak_count: 0, best_streak: 0 };
      var streak = ok ? (row.streak_count || 0) + 1 : 0;
      await db.from('practice_progress').upsert({
        user_id: uid, school_level: valid(schoolLevel, D.ALLOWED.schoolLevel), field: valid(field, D.ALLOWED.field) || 'integrated',
        unit: unit ? String(unit).slice(0, 80) : null, level: 'normal',
        total_count: (row.total_count || 0) + 1, correct_count: (row.correct_count || 0) + (ok ? 1 : 0),
        wrong_count: (row.wrong_count || 0) + (ok ? 0 : 1), streak_count: streak,
        best_streak: Math.max(row.best_streak || 0, streak),
        last_practiced_at: new Date().toISOString(), updated_at: new Date().toISOString()
      });
      return true;
    } catch (e) { return false; }
  }

  // ---------- 퀴즈 결과 ----------
  async function saveQuizResult(r) {
    var total = Math.min(100, Math.max(1, parseInt(r.total_questions, 10) || 0));
    var correct = Math.min(total, Math.max(0, parseInt(r.correct_count, 10) || 0));
    var score = Math.min(100, Math.max(0, parseInt(r.score, 10) || 0));
    var dur = r.duration_seconds == null ? null : Math.min(86400, Math.max(0, parseInt(r.duration_seconds, 10) || 0));
    var row = {
      quiz_type: String(r.quiz_type || 'mixed').slice(0, 30),
      school_level: valid(r.school_level, D.ALLOWED.schoolLevel.concat(['all'])),
      field: r.field ? valid(r.field, D.ALLOWED.field) : null,
      unit: r.unit ? String(r.unit).slice(0, 80) : null,
      level: r.level ? valid(r.level, D.ALLOWED.level) : null,
      total_questions: total, correct_count: correct, score: score,
      duration_seconds: dur, result_data: r.result_data || null,
      created_at: new Date().toISOString()
    };
    var local = read(LS.quiz, []);
    local.unshift(row);
    write(LS.quiz, local.slice(0, 50));
    if (!loggedIn()) return false;
    var db = sdb(), uid = userId();
    if (!db || !uid) return false;
    try {
      var payload = Object.assign({}, row);
      delete payload.created_at;
      payload.user_id = uid;
      if (payload.school_level === 'all') payload.school_level = null;
      await db.from('quiz_results').insert(payload);
      await saveStudyLog({ activity_type: 'quiz', school_level: payload.school_level, total_count: 1 });
      return true;
    } catch (e) { return false; }
  }

  // ---------- 오답노트 ----------
  function getWrongNotes() { return read(LS.wrong, []); }
  async function addWrongNote(p, given) {
    var note = {
      id: 'w_' + Date.now().toString(36) + Math.floor(Math.random() * 999),
      conceptId: p.conceptId || null, schoolLevel: p.schoolLevel || null, gradeLevel: p.gradeLevel || null,
      field: p.field || null, unit: p.unit || null, level: p.level || null,
      question: String(p.question || '').slice(0, 500), answer: String(p.answer || '').slice(0, 200),
      given: String(given == null ? '' : given).slice(0, 200), explanation: String(p.explanation || '').slice(0, 800),
      solved: false, retry: 0, at: new Date().toISOString()
    };
    var local = getWrongNotes();
    if (local.some(function (n) { return n.question === note.question && !n.solved; })) return note;
    local.unshift(note);
    write(LS.wrong, local.slice(0, 200));
    if (loggedIn()) {
      var db = sdb(), uid = userId();
      try {
        if (db && uid) {
          await db.from('wrong_notes').insert({
            user_id: uid, school_level: valid(note.schoolLevel, D.ALLOWED.schoolLevel),
            grade_level: note.gradeLevel, field: valid(note.field, D.ALLOWED.field) || 'integrated',
            unit: note.unit ? String(note.unit).slice(0, 80) : null, concept_id: note.conceptId,
            level: note.level ? valid(note.level, D.ALLOWED.level) : null,
            question_text: note.question, correct_answer: note.answer,
            user_answer: note.given, explanation: note.explanation, solved: false, retry_count: 0
          });
        }
      } catch (e) {}
    }
    return note;
  }
  function markWrongSolved(id, solved) {
    var local = getWrongNotes();
    local.forEach(function (n) { if (n.id === id) n.solved = solved !== false; });
    write(LS.wrong, local);
    if (loggedIn()) {
      var db = sdb(), uid = userId();
      if (db && uid && String(id).length > 20) {
        db.from('wrong_notes').update({ solved: solved !== false, retry_count: 1, updated_at: new Date().toISOString() })
          .eq('id', id).eq('user_id', uid).then(function () {}, function () {});
      }
    }
  }
  function removeWrongNote(id) {
    write(LS.wrong, getWrongNotes().filter(function (n) { return n.id !== id; }));
    if (loggedIn()) {
      var db = sdb(), uid = userId();
      if (db && uid && String(id).length > 20) {
        db.from('wrong_notes').delete().eq('id', id).eq('user_id', uid).then(function () {}, function () {});
      }
    }
  }

  // ---------- 실험 기록 ----------
  async function saveExperimentLog(experimentId, note) {
    var row = { experimentId: String(experimentId).slice(0, 80), note: String(note || '').slice(0, 1000), at: new Date().toISOString() };
    var local = read(LS.exp, []);
    local.unshift(row);
    write(LS.exp, local.slice(0, 100));
    if (loggedIn()) {
      var db = sdb(), uid = userId();
      try {
        if (db && uid) await db.from('experiment_log').insert({ user_id: uid, experiment_id: row.experimentId, observation: row.note });
      } catch (e) {}
    }
    return true;
  }

  async function saveStudyLog(a) {
    var db = sdb(), uid = userId();
    if (!db || !uid) return false;
    try {
      await db.from('study_log').insert({
        user_id: uid, activity_type: String(a.activity_type || 'practice').slice(0, 30),
        school_level: valid(a.school_level, D.ALLOWED.schoolLevel),
        grade_level: a.grade_level || null,
        field: a.field ? valid(a.field, D.ALLOWED.field) : null,
        unit: a.unit ? String(a.unit).slice(0, 80) : null,
        concept_id: a.concept_id ? String(a.concept_id).slice(0, 80) : null,
        count_total: a.count_total || 0, count_correct: a.count_correct || 0,
        duration_seconds: a.duration_seconds || null
      });
      return true;
    } catch (e) { return false; }
  }

  // ---------- 로그인 시 병합 ----------
  async function mergeLocalToCloud() {
    var db = sdb(), uid = userId();
    if (!db || !uid) return false;
    try {
      var done = getDone();
      var r = await db.from('concept_progress').select('concept_id').eq('user_id', uid);
      var remote = ((r && r.data) || []).map(function (x) { return x.concept_id; });
      var toUp = done.filter(function (id) { return remote.indexOf(id) === -1; });
      for (var i = 0; i < Math.min(toUp.length, 100); i++) {
        await upsertConceptProgress(toUp[i], true);
      }
      var wrongs = getWrongNotes().filter(function (n) { return !n.solved; }).slice(0, 30);
      for (var j = 0; j < wrongs.length; j++) {
        var n = wrongs[j];
        try {
          await db.from('wrong_notes').insert({
            user_id: uid, school_level: valid(n.schoolLevel, D.ALLOWED.schoolLevel),
            field: valid(n.field, D.ALLOWED.field) || 'integrated',
            unit: n.unit ? String(n.unit).slice(0, 80) : null, concept_id: n.conceptId,
            question_text: n.question, correct_answer: n.answer, user_answer: n.given,
            explanation: n.explanation, solved: false, retry_count: 0
          });
        } catch (e) {}
      }
      return true;
    } catch (e) { return false; }
  }

  // ---------- 통계 집계 ----------
  function stats() {
    var log = read(LS.session, []);
    var quizzes = read(LS.quiz, []);
    var wrongs = getWrongNotes();
    var total = log.length, correct = log.filter(function (l) { return l.ok; }).length;
    var byField = {}, bySchool = {};
    log.forEach(function (l) {
      var f = l.field || 'integrated';
      byField[f] = byField[f] || { total: 0, correct: 0 };
      byField[f].total++; if (l.ok) byField[f].correct++;
      var s = l.schoolLevel || 'all';
      bySchool[s] = bySchool[s] || { total: 0, correct: 0 };
      bySchool[s].total++; if (l.ok) bySchool[s].correct++;
    });
    var weekAgo = Date.now() - 7 * 86400 * 1000;
    var weekCount = log.filter(function (l) { return new Date(l.at).getTime() > weekAgo; }).length;
    return {
      conceptsDone: getDone().length, total: total, correct: correct,
      rate: total ? Math.round(correct / total * 100) : 0,
      byField: byField, bySchool: bySchool,
      wrongCount: wrongs.filter(function (w) { return !w.solved; }).length,
      quizzes: quizzes.slice(0, 8), weekCount: weekCount,
      recentQuizzes: quizzes.slice(0, 3)
    };
  }

  window.ScienceProgress = {
    LS: LS,
    getDone: getDone, isConceptDone: isConceptDone, toggleConceptDone: toggleConceptDone,
    recordAttempt: recordAttempt, saveQuizResult: saveQuizResult,
    getWrongNotes: getWrongNotes, addWrongNote: addWrongNote,
    markWrongSolved: markWrongSolved, removeWrongNote: removeWrongNote,
    saveExperimentLog: saveExperimentLog, saveStudyLog: saveStudyLog,
    mergeLocalToCloud: mergeLocalToCloud, stats: stats
  };
})();
