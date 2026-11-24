(function () {
  var head = document.querySelector('.site-head');
  var btn = document.querySelector('.menu-btn');

  // 헤더: 스크롤하면 아래 선 표시
  function onScroll() { head.classList.toggle('is-stuck', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 모바일 메뉴
  function setMenu(open) {
    head.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  }
  btn.addEventListener('click', function () { setMenu(!head.classList.contains('nav-open')); });
  document.querySelectorAll('.nav a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // 먹는 법 탭
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
        selectTab(tabs[n], true);
      }
    });
  });

  // 출시 일정: 스크롤 진입 애니메이션 + 단계 클릭 상세
  var tl = document.querySelector('[data-tl]');
  if (tl) {
    var steps = Array.prototype.slice.call(tl.querySelectorAll('.step'));
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var selectStep = function (step, focus) {
      steps.forEach(function (s) {
        var on = s === step;
        var panel = document.getElementById(s.getAttribute('aria-controls'));
        s.setAttribute('aria-selected', on ? 'true' : 'false');
        s.tabIndex = on ? 0 : -1;
        panel.hidden = !on;
        panel.classList.remove('swap');
        if (on && !reduce) { void panel.offsetWidth; panel.classList.add('swap'); }
      });
      if (focus) step.focus();
    };
    steps.forEach(function (step, i) {
      step.addEventListener('click', function () { selectStep(step, false); });
      step.addEventListener('keydown', function (e) {
        var k = e.key;
        var d = (k === 'ArrowRight' || k === 'ArrowDown') ? 1 : (k === 'ArrowLeft' || k === 'ArrowUp') ? -1 : 0;
        if (d) { e.preventDefault(); selectStep(steps[(i + d + steps.length) % steps.length], true); }
      });
    });
    if (!reduce && 'IntersectionObserver' in window) {
      tl.classList.add('tl-anim');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { tl.classList.add('is-in'); io.disconnect(); }
        });
      }, { threshold: 0.3 });
      io.observe(tl);
    } else {
      tl.classList.add('is-in');
    }
  }
})();
