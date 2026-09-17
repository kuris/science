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
  function concepts() { return window.ScienceConceptData || []; }

  // 개념의 핵심어 추출 (서술형 대신 빈칸·객관식으로 출제하기 위함)
  // 우선순위: quickCheck.answer가 짧으면 그대로, 길면 memoryTip·title 활용
  function conceptKeyword(c) {
    if (!c) return '';
    var qa = (c.quickCheck && c.quickCheck.answer) || '';
    if (qa && qa.length <= 12) return qa;
    if (c.memoryTip) {
      var m = c.memoryTip.split('!')[0].split('.')[0].trim();
      if (m && m.length <= 24) return m;
    }
    return c.title;
  }

  // 같은 분야의 다른 개념 제목 (객관식 오답용)
  function siblingTitles(c, n) {
    var pool = shuffle(concepts().filter(function (x) {
      return x.id !== c.id && x.field === c.field && x.schoolLevel === c.schoolLevel;
    }));
    if (pool.length < n) {
      pool = pool.concat(shuffle(concepts().filter(function (x) {
        return x.id !== c.id && pool.indexOf(x) === -1;
      })));
    }
    return pool.slice(0, n).map(function (x) { return x.title; });
  }

  // 빈칸형: 설명 속 핵심어를 빈칸으로 (질문 형식 4종 로테이션)
  function generateBlankProblem(c, level) {
    var kw = conceptKeyword(c);
    var desc = c.shortDescription || '';
    var p = base(c.id, c.schoolLevel, c.gradeLevel, c.field, c.unit, level || 'easy');
    p.type = 'multiple_choice';
    var answer, q, distract;
    var variant = rndInt(0, 3);
    if (variant === 0 || !desc) {
      // 개념 고르기
      answer = c.title;
      q = '"' + desc + '" — 이 설명에 해당하는 개념은 무엇인가요?';
      distract = siblingTitles(c, 3);
    } else if (variant === 1 && desc && kw && desc.indexOf(kw) !== -1 && kw.length >= 2) {
      // 빈칸 채우기
      answer = kw;
      q = '빈칸에 들어갈 말은? "' + desc.replace(kw, '○○') + '"';
      distract = siblingTitles(c, 2).concat([c.title]);
    } else if (variant === 2 && c.example && c.example.answer) {
      // 예제 기반: 예제 질문 → 정답 고르기
      answer = String(c.example.answer).length <= 16 ? c.example.answer : c.title;
      q = '(예제) ' + c.example.question;
      distract = answer === c.title ? siblingTitles(c, 3) : siblingTitles(c, 2).concat([c.title]);
    } else {
      // 암기팁 연결: 팁의 앞부분이 설명하는 개념은?
      answer = c.title;
      q = '"' + c.memoryTip + '" — 이 꿀팁이 설명하는 개념은 무엇인가요?';
      distract = siblingTitles(c, 3);
    }
    p.question = q;
    p.answer = answer;
    p.choices = makeChoices(answer, distract);
    p.explanation = c.title + ': ' + desc + ' 외우는 꿀팁 - ' + c.memoryTip;
    p.hint = '💡 힌트: ' + c.memoryTip;
    return p;
  }

  // 개념 확인 객관식: 항상 "이 개념"에 대해서만 출제 (엉뚱한 개념 섞지 않음)
  function generateConceptQuiz(level, fixedConceptId) {
    var list = concepts();
    if (!list.length) return null;
    var c = fixedConceptId
      ? list.filter(function (x) { return x.id === fixedConceptId; })[0]
      : list[rndInt(0, list.length - 1)];
    if (!c) return null;
    return generateBlankProblem(c, level);
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
    // 부족분은 "같은 개념"의 빈칸·확인 문제로만 채운다 (엉뚱한 개념 섞지 않음)
    while (out.length < count && guard < count * 2) {
      var q = generateConceptQuiz(level === 'all' ? undefined : level, conceptId);
      if (q) out.push(q);
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
