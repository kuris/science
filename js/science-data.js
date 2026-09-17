/* ============================================================
   과학아 놀자! - 학교급/학년/분야/단원/난이도 기준 데이터
   - AI 없이 정적 데이터 + 규칙 기반 생성만 사용합니다.
   ============================================================ */
(function () {
  var SCHOOL_LEVELS = [
    { value: 'elementary', label: '초등', emoji: '🌱', color: '#16a34a' },
    { value: 'middle', label: '중등', emoji: '🌿', color: '#2563eb' },
    { value: 'high', label: '고등', emoji: '🌳', color: '#7c3aed' }
  ];

  var GRADE_LEVELS = [
    { value: 'elementary3', schoolLevel: 'elementary', label: '초3' },
    { value: 'elementary4', schoolLevel: 'elementary', label: '초4' },
    { value: 'elementary5', schoolLevel: 'elementary', label: '초5' },
    { value: 'elementary6', schoolLevel: 'elementary', label: '초6' },
    { value: 'middle1', schoolLevel: 'middle', label: '중1' },
    { value: 'middle2', schoolLevel: 'middle', label: '중2' },
    { value: 'middle3', schoolLevel: 'middle', label: '중3' },
    { value: 'high_common', schoolLevel: 'high', label: '공통/통합' },
    { value: 'high_physics', schoolLevel: 'high', label: '물리' },
    { value: 'high_chemistry', schoolLevel: 'high', label: '화학' },
    { value: 'high_biology', schoolLevel: 'high', label: '생명과학' },
    { value: 'high_earth_science', schoolLevel: 'high', label: '지구과학' },
    { value: 'high_integrated_science', schoolLevel: 'high', label: '통합과학' }
  ];

  var FIELDS = [
    { value: 'physics', label: '물리', emoji: '⚙️', color: '#2563eb' },
    { value: 'chemistry', label: '화학', emoji: '🧪', color: '#7c3aed' },
    { value: 'biology', label: '생명과학', emoji: '🌱', color: '#16a34a' },
    { value: 'earth_science', label: '지구과학', emoji: '🌍', color: '#0284c7' },
    { value: 'integrated', label: '통합과학', emoji: '🔬', color: '#0d9488' },
    { value: 'experiment', label: '실험/관찰', emoji: '👀', color: '#ea580c' }
  ];

  var LEVELS = [
    { value: 'basic', label: '기초' },
    { value: 'easy', label: '쉬움' },
    { value: 'normal', label: '보통' },
    { value: 'hard', label: '어려움' },
    { value: 'advanced', label: '심화' }
  ];

  var PRAISE = [
    '좋아요! 개념을 정확히 이해했어요. 🎉',
    '멋져요! 과학자의 눈으로 잘 관찰했어요. 🔬',
    '한 단계 성장했어요! 🚀',
    '개념 마스터에 가까워졌어요. 🏅',
    '와! 실험 결과까지 잘 연결했어요. 🧪'
  ];

  var COMFORT = [
    '괜찮아요. 개념부터 다시 천천히 볼까요? 🌱',
    '거의 다 왔어요. 단위나 조건을 한 번 더 확인해 봐요. 👀',
    '실수는 발견의 시작이에요. 🔍',
    '과학자는 틀리면서 더 잘 배워요. 💪'
  ];

  var ALLOWED = {
    schoolLevel: ['elementary', 'middle', 'high'],
    gradeLevel: GRADE_LEVELS.map(function (g) { return g.value; }),
    field: FIELDS.map(function (f) { return f.value; }),
    level: LEVELS.map(function (l) { return l.value; })
  };

  function labelOf(list, value) {
    var f = list.filter(function (x) { return x.value === value; })[0];
    return f ? f.label : value;
  }

  window.SciencePlayData = {
    SCHOOL_LEVELS: SCHOOL_LEVELS,
    GRADE_LEVELS: GRADE_LEVELS,
    FIELDS: FIELDS,
    LEVELS: LEVELS,
    PRAISE: PRAISE,
    COMFORT: COMFORT,
    ALLOWED: ALLOWED,
    schoolLabel: function (v) { return labelOf(SCHOOL_LEVELS, v); },
    gradeLabel: function (v) { return labelOf(GRADE_LEVELS, v); },
    fieldLabel: function (v) { return labelOf(FIELDS, v); },
    levelLabel: function (v) { return labelOf(LEVELS, v); },
    fieldColor: function (v) {
      var f = FIELDS.filter(function (x) { return x.value === v; })[0];
      return f ? f.color : '#0d9488';
    },
    schoolColor: function (v) {
      var f = SCHOOL_LEVELS.filter(function (x) { return x.value === v; })[0];
      return f ? f.color : '#0d9488';
    }
  };
})();
