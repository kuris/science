/* ============================================================
   과학아 놀자! - 규칙 기반 문제 생성기 (AI API 사용 없음)
   - 속력/밀도/옴의법칙/몰 계산 등은 랜덤 숫자로 생성
   - 정적 문제와 같은 {question, answer, choices, explanation} 구조
   ============================================================ */
(function () {
  function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function makeChoices(answer, distract) {
    var set = [String(answer)];
    (distract || []).forEach(function (d) {
      d = String(d);
      if (set.indexOf(d) === -1 && set.length < 4) set.push(d);
    });
    var n = Number(answer);
    var k = 1;
    while (set.length < 4 && k < 20) {
      var cand = isNaN(n) ? answer + k : String(n + k);
      if (set.indexOf(cand) === -1) set.push(cand);
      cand = isNaN(n) ? answer + (k + 1) : String(n - k);
      if (set.indexOf(cand) === -1 && set.length < 4) set.push(cand);
      k++;
    }
    return shuffle(set.slice(0, 4));
  }
  function base(conceptId, schoolLevel, gradeLevel, field, unit, level) {
    return {
      id: 'generated_' + conceptId + '_' + Date.now().toString(36) + '_' + rndInt(100, 999),
      conceptId: conceptId, schoolLevel: schoolLevel, gradeLevel: gradeLevel,
      field: field, unit: unit, level: level, type: 'multiple_choice',
      unitAnswer: null, hint: ''
    };
  }

  function generateSpeedProblem(level) {
    var t = rndInt(5, 30), v = rndInt(2, 20), d = v * t;
    var p = base('middle_speed', 'middle', 'middle1', 'physics', '운동과 에너지', level || 'easy');
    p.question = d + 'm를 ' + t + '초 동안 이동한 물체의 속력은 몇 m/s인가요?';
    p.answer = String(v); p.unitAnswer = 'm/s';
    p.choices = makeChoices(v, [v + 1, v + 2, Math.max(1, v - 1)]);
    p.explanation = '속력은 거리 ÷ 시간이에요. ' + d + ' ÷ ' + t + ' = ' + v + '이므로 ' + v + 'm/s입니다.';
    p.hint = '속력 공식은 거리 ÷ 시간이에요.';
    return p;
  }
  function generateDensityProblem(level) {
    var vol = rndInt(2, 20), den = rndInt(1, 10), mass = den * vol;
    var p = base('middle_density', 'middle', 'middle1', 'chemistry', '물질', level || 'normal');
    p.question = '질량 ' + mass + 'g, 부피 ' + vol + 'cm³인 물질의 밀도는 몇 g/cm³인가요?';
    p.answer = String(den); p.unitAnswer = 'g/cm³';
    p.choices = makeChoices(den, [den + 1, den + 2, Math.max(1, den - 1)]);
    p.explanation = '밀도는 질량 ÷ 부피예요. ' + mass + ' ÷ ' + vol + ' = ' + den + '이므로 ' + den + 'g/cm³입니다.';
    p.hint = '밀도 공식은 질량 ÷ 부피예요.';
    return p;
  }
  function generateOhmLawProblem(level) {
    var i = rndInt(1, 9), r = rndInt(2, 20), v = i * r;
    var p = base('middle_ohm', 'middle', 'middle2', 'physics', '전기', level || 'normal');
    p.question = '전류 ' + i + 'A, 저항 ' + r + 'Ω인 회로의 전압은 몇 V인가요?';
    p.answer = String(v); p.unitAnswer = 'V';
    p.choices = makeChoices(v, [v + r, v + i, Math.max(1, v - i)]);
    p.explanation = '옴의 법칙으로 전압 = 전류 × 저항이에요. ' + i + ' × ' + r + ' = ' + v + '이므로 ' + v + 'V입니다.';
    p.hint = '전압 = 전류 × 저항이에요.';
    return p;
  }
  function generateMoleProblem(level) {
    var molar = [18, 44, 58, 100][rndInt(0, 3)], mol = rndInt(1, 5), mass = molar * mol;
    var p = base('high_mole', 'high', 'high_chemistry', 'chemistry', '몰', level || 'hard');
    p.question = '몰질량 ' + molar + 'g/mol인 물질 ' + mass + 'g은 몇 mol인가요?';
    p.answer = String(mol); p.unitAnswer = 'mol';
    p.choices = makeChoices(mol, [mol + 1, mol + 2, Math.max(1, mol - 1)]);
    p.explanation = '몰수 = 질량 ÷ 몰질량이에요. ' + mass + ' ÷ ' + molar + ' = ' + mol + '이므로 ' + mol + 'mol입니다.';
    p.hint = '몰수 = 질량 ÷ 몰질량이에요.';
    return p;
  }
  function generateConceptQuiz(level) {
    var concepts = window.ScienceConceptData || [];
    if (!concepts.length) return null;
    var c = concepts[rndInt(0, concepts.length - 1)];
    var others = shuffle(concepts.filter(function (x) { return x.id !== c.id; })).slice(0, 3).map(function (x) { return x.title; });
    return {
      id: 'generated_quiz_' + Date.now().toString(36),
      conceptId: c.id, schoolLevel: c.schoolLevel, gradeLevel: c.gradeLevel,
      field: c.field, unit: c.unit, level: level || 'easy', type: 'multiple_choice',
      question: '다음 설명에 해당하는 개념은 무엇인가요? "' + c.shortDescription + '"',
      choices: shuffle([c.title].concat(others)),
      answer: c.title, unitAnswer: null,
      explanation: c.title + ': ' + c.shortDescription + ' 외우는 꿀팁 - ' + c.memoryTip,
      hint: '개념의 첫 문장을 떠올려 보세요.'
    };
  }

  function byConcept(conceptId, count, level) {
    var statics = (window.ScienceProblemData || []).filter(function (p) {
      return p.conceptId === conceptId && (!level || level === 'all' || p.level === level);
    });
    var out = shuffle(statics).slice(0, count);
    var gens = { middle_speed: generateSpeedProblem, middle_density: generateDensityProblem, middle_ohm: generateOhmLawProblem, high_mole: generateMoleProblem };
    var g = gens[conceptId];
    var guard = 0;
    while (out.length < count && g && guard < count * 2) {
      out.push(g(level === 'all' ? undefined : level));
      guard++;
    }
    guard = 0;
    while (out.length < count && guard < count * 2) {
      var q = generateConceptQuiz(level === 'all' ? undefined : level);
      if (q) { q.conceptId = conceptId; out.push(q); }
      guard++;
    }
    return out.slice(0, count);
  }

  function byField(field, schoolLevel, gradeLevel, count, level) {
    var concepts = (window.ScienceConceptData || []).filter(function (c) {
      return (!field || field === 'all' || c.field === field) &&
             (!schoolLevel || schoolLevel === 'all' || c.schoolLevel === schoolLevel) &&
             (!gradeLevel || gradeLevel === 'all' || c.gradeLevel === gradeLevel);
    });
    var out = [];
    var per = Math.max(1, Math.ceil(count / Math.max(1, concepts.length)));
    concepts.forEach(function (c) {
      if (out.length >= count) return;
      byConcept(c.id, Math.min(per, count - out.length), level).forEach(function (p) { out.push(p); });
    });
    return shuffle(out).slice(0, count);
  }

  function generateProblems(options) {
    var o = options || {};
    if (o.conceptId) return byConcept(o.conceptId, o.count || 10, o.level || 'all');
    return byField(o.field || 'all', o.schoolLevel || 'all', o.gradeLevel || 'all', o.count || 10, o.level || 'all');
  }

  window.ScienceGenerator = {
    generateProblems: generateProblems,
    generateByConcept: byConcept,
    generateByField: byField,
    generateSpeedProblem: generateSpeedProblem,
    generateDensityProblem: generateDensityProblem,
    generateOhmLawProblem: generateOhmLawProblem,
    generateMoleProblem: generateMoleProblem,
    generateConceptQuiz: generateConceptQuiz,
    makeChoices: makeChoices,
    shuffle: shuffle
  };
})();
