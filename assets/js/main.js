(function () {
  // 문장 단위 줄바꿈: 문장이 끝난 자리에서만 줄이 바뀌게 하고, 한 문장이 길면 그 안에서 고르게 나눈다
  (function () {
    var skip = '.label-val,.bigname,.handle,.crumb,.kicker,.role,.where,.when,.en,.tagline,.foot,.copy,.word,.k';
    var cut = function (t) {
      var out = [], start = 0;
      for (var i = 0; i < t.length; i++) {
        var c = t.charAt(i);
        if ((c === '.' || c === '?' || c === '!') && /\s/.test(t.charAt(i + 1) || '')) {
          var j = i + 1;
          while (j < t.length && /\s/.test(t.charAt(j))) j++;
          out.push(t.slice(start, j)); start = j; i = j - 1;
        }
      }
      if (start < t.length) out.push(t.slice(start));
      return out;
    };
    var targets = document.querySelectorAll('main p, main .flow-desc, main .pack-list li span, main .modi dd, main .channels .note, .foot-brand p');
    Array.prototype.forEach.call(targets, function (el) {
      if (el.matches(skip) || el.querySelector('br')) return;
      Array.prototype.slice.call(el.childNodes).forEach(function (n) {
        if (n.nodeType !== 3 || !n.nodeValue.trim()) return;
        var frag = document.createDocumentFragment();
        cut(n.nodeValue).forEach(function (part) {
          var body = part.replace(/\s+$/, '');
          if (!body) { frag.appendChild(document.createTextNode(part)); return; }
          var lead = part.match(/^\s*/)[0];
          if (lead) frag.appendChild(document.createTextNode(' '));
          var s = document.createElement('span');
          s.className = 's';
          // 쉼표 뒤에서 먼저 끊기도록 구(句) 단위로 한 번 더 묶는다
          var clauses = body.replace(/^\s+/, '').split(/(?:,\s+)/);
          clauses.forEach(function (cl, ci) {
            var c = document.createElement('span');
            c.className = 'c';
            c.textContent = cl + (ci < clauses.length - 1 ? ',' : '');
            s.appendChild(c);
            if (ci < clauses.length - 1) s.appendChild(document.createTextNode(' '));
          });
          frag.appendChild(s);
          if (body.length < part.length) frag.appendChild(document.createTextNode(' '));
        });
        el.replaceChild(frag, n);
      });
    });
  })();

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

  // 경로(충청에서 식탁까지): 스크롤 진입 시 차례로 나타나고, 한 단계씩 자동으로 넘어가며, 누르면 그 단계에 멈춤
  var flow = document.querySelector('[data-flow]');
  if (flow) {
    var fSteps = Array.prototype.slice.call(flow.querySelectorAll('.flow-step'));
    var fReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fTimer = null, fStopped = false, fNow = 0;
    var setFlow = function (n) {
      fNow = n;
      flow.setAttribute('data-on', String(n));
      fSteps.forEach(function (s, i) {
        s.classList.toggle('is-on', i === n);
        s.classList.toggle('is-done', i < n);
        s.setAttribute('aria-pressed', i === n ? 'true' : 'false');
      });
    };
    var play = function () {
      if (fReduce || fStopped || fTimer) return;
      fTimer = setInterval(function () { setFlow((fNow + 1) % fSteps.length); }, 2600);
    };
    var pause = function () { if (fTimer) { clearInterval(fTimer); fTimer = null; } };
    fSteps.forEach(function (s, i) {
      s.addEventListener('click', function () { fStopped = true; pause(); setFlow(i); });
      s.addEventListener('mouseenter', function () { pause(); setFlow(i); });
      s.addEventListener('mouseleave', function () { play(); });
    });
    setFlow(0);
    if (!fReduce && 'IntersectionObserver' in window) {
      flow.classList.add('flow-anim');
      var fio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { flow.classList.add('is-in'); setTimeout(play, 1200); fio.disconnect(); }
        });
      }, { threshold: 0.35 });
      fio.observe(flow);
    } else {
      flow.classList.add('is-in');
      setFlow(fSteps.length - 1);
    }
  }
})();
