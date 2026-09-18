/* ============================================================
   과학아 놀자! - 공통 상단 내비게이션 (playhanja nav.js 참고)
   ============================================================ */
(function () {
  var MENU = [
    { label: '홈', href: 'index.html', icon: '🏠' },
    {
      label: '배우기', icon: '📚',
      children: [
        { label: '개념 보기', href: 'concepts.html', icon: '🔬', desc: '초중고 개념·법칙·공식 정리' },
        { label: '실험/관찰', href: 'experiment.html', icon: '🧪', desc: '집에서 하는 안전한 관찰 활동' },
        { label: '학습지 만들기', href: 'worksheet.html', icon: '📄', desc: 'A4 인쇄용 문제지' }
      ]
    },
    {
      label: '풀기', icon: '✏️',
      children: [
        { label: '문제 풀기', href: 'practice.html', icon: '✏️', desc: '개념별·단원별 연습' },
        { label: '퀴즈', href: 'quiz.html', icon: '🧩', desc: '개념·공식·실험 퀴즈' }
      ]
    },
    { label: '내 진도', href: 'progress.html', icon: '🗺️' },
    { label: '통계', href: 'stats.html', icon: '📈' }
  ];


  function currentFile() {
    var f = (location.pathname.split('/').pop() || 'index.html');
    return f === '' ? 'index.html' : f.split('?')[0];
  }
  function here() { return currentFile(); }

  function buildDesktop(h) {
    var html = MENU.map(function (item) {
      if (!item.children) {
        return '<li><a href="' + item.href + '"' + (item.href === h ? ' class="active"' : '') + '>' + item.icon + ' ' + item.label + '</a></li>';
      }
      var active = item.children.some(function (c) { return c.href === h; });
      return '<li class="nav-group"><button class="nav-group-btn' + (active ? ' active' : '') + '" aria-expanded="false">' +
        item.icon + ' ' + item.label + ' <i class="fa-solid fa-chevron-down"></i></button>' +
        '<div class="nav-dropdown">' + item.children.map(function (c) {
          return '<a href="' + c.href + '" class="' + (c.href === h ? 'current' : '') + '"><span class="nd-icon">' + c.icon +
            '</span><span class="nd-body"><strong>' + c.label + '</strong><small>' + (c.desc || '') + '</small></span></a>';
        }).join('') + '</div></li>';
    }).join('');
    html += '<li class="nav-family-item"><div data-cg-family data-current="science"></div></li>';
    return html;
  }

  function buildMobile(h) {
    var html = MENU.map(function (item) {
      if (!item.children) return '<li><a href="' + item.href + '"' + (item.href === h ? ' class="active"' : '') + '>' + item.icon + ' ' + item.label + '</a></li>';
      return '<li class="m-group"><span class="m-group-title">' + item.icon + ' ' + item.label + '</span><ul class="m-sub">' +
        item.children.map(function (c) { return '<li><a href="' + c.href + '"' + (c.href === h ? ' class="active"' : '') + '>' + c.icon + ' ' + c.label + '</a></li>'; }).join('') + '</ul></li>';
    }).join('');
    html += '<li class="m-group" style="border-top:2px solid rgba(13,148,136,.25);margin-top:10px;padding-top:10px;"><span class="m-group-title" style="color:#0d9488;font-weight:800;">🎡 다른 놀자 서비스</span><div data-cg-family="flat" data-current="science"></div></li>';
    return html;
  }

  function initNav() {
    var navToggle = document.getElementById('nav-toggle');
    var mainNav = document.getElementById('main-nav');
    if (!navToggle || !mainNav) return;
    var h = here();
    mainNav.innerHTML = '<ul class="nav-desktop">' + buildDesktop(h) + '</ul><ul class="nav-mobile">' + buildMobile(h) + '</ul>';
    if (window.CGFamily) window.CGFamily.autoInit();
    var icon = navToggle.querySelector('i');
    function closeAllDropdowns() {
      var fd = document.querySelector('.cg-fam-wrap.open');
      if (fd) fd.classList.remove('open');
      mainNav.querySelectorAll('.nav-group.open').forEach(function (g) { g.classList.remove('open'); });
    }
    function openNav() { mainNav.classList.add('open'); document.body.classList.add('nav-open'); if (icon) icon.className = 'fa-solid fa-xmark'; }
    function closeNav() { mainNav.classList.remove('open'); document.body.classList.remove('nav-open'); if (icon) icon.className = 'fa-solid fa-bars'; closeAllDropdowns(); }
    navToggle.addEventListener('click', function (e) { e.stopPropagation(); mainNav.classList.contains('open') ? closeNav() : openNav(); });
    // 패밀리 드롭다운 토글은 cg-family.js 자체 처리
    mainNav.querySelectorAll('.nav-group-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var group = btn.closest('.nav-group');
        var wasOpen = group.classList.contains('open');
        closeAllDropdowns();
        if (!wasOpen) group.classList.add('open');
      });
    });
    mainNav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeNav); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeAllDropdowns(); closeNav(); } });
    window.addEventListener('resize', function () { if (!window.matchMedia('(max-width: 1024px)').matches) closeNav(); });
  }

  function trackPageView() {
    try {
      var f = here();
      if (f === 'admin.html') return;
      var STATS_KEY = 'science_local_pv_stats';
      var stats = JSON.parse(localStorage.getItem(STATS_KEY) || '{"pages":{},"recent":[]}');
      stats.pages[f] = (stats.pages[f] || 0) + 1;
      stats.recent = (stats.recent || []).slice(0, 29);
      stats.recent.unshift({ path: f, time: new Date().toISOString() });
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { initNav(); trackPageView(); });
  else { initNav(); trackPageView(); }
})();
