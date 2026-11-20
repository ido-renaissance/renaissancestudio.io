/* Renaissance Studio UI: auto-playing sample previews (no scroll trap) + industry picker.
   Load with defer BEFORE site.js. Exposes window.RSReel = { image(img), frame(iframe, slug) }. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = 62;            // visual px per second
  const HOLD_TOP = 1400, HOLD_END = 1800;

  /* ---------- Reel: a slow, video-like auto scroll inside a .viewport ---------- */
  function ui(viewport) {
    let bar = viewport.querySelector('.reel-ui');
    if (bar) return bar;
    bar = document.createElement('div');
    bar.className = 'reel-ui';
    bar.innerHTML = '<button type="button" class="reel-btn" aria-label="Pause preview" aria-pressed="false">' +
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path class="i-pause" d="M4 3h3v10H4zM9 3h3v10H9z"/><path class="i-play" d="M4 3l9 5-9 5z"/></svg></button>' +
      '<span class="reel-track" aria-hidden="true"><span class="reel-fill"></span></span>';
    viewport.appendChild(bar);
    return bar;
  }

  class Runner {
    constructor(viewport, measure, setPos) {
      this.v = viewport; this.measure = measure; this.setPos = setPos;
      this.y = 0; this.phase = 'top'; this.t0 = performance.now(); this.paused = false; this.visible = true; this.raf = 0;
      this.bar = ui(viewport); this.fill = this.bar.querySelector('.reel-fill'); this.btn = this.bar.querySelector('.reel-btn');
      this.btn.onclick = () => { this.paused = !this.paused; this.sync(); };
      if ('IntersectionObserver' in window) {
        this.io = new IntersectionObserver(es => { this.visible = es[0].isIntersecting; this.sync(); }, { threshold: 0.05 });
        this.io.observe(viewport);
      }
      this.onVis = () => this.sync(); document.addEventListener('visibilitychange', this.onVis);
      this.sync();
    }
    sync() {
      this.btn.setAttribute('aria-pressed', String(this.paused));
      this.btn.setAttribute('aria-label', this.paused ? 'Play preview' : 'Pause preview');
      this.v.classList.toggle('is-paused', this.paused);
      const run = !this.paused && this.visible && !document.hidden && !reduce;
      if (run && !this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(t => this.tick(t)); }
      if (!run && this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; }
    }
    tick(now) {
      const dt = Math.min(64, now - this.last); this.last = now;
      const { max, rate } = this.measure();
      if (max > 0) {
        if (this.phase === 'top') { if (now - this.t0 > HOLD_TOP) this.phase = 'run'; }
        else if (this.phase === 'run') {
          this.y = Math.min(max, this.y + rate * dt / 1000);
          if (this.y >= max) { this.phase = 'end'; this.t0 = now; }
        } else if (this.phase === 'end' && now - this.t0 > HOLD_END) {
          this.v.classList.add('reel-fade');
          setTimeout(() => { this.y = 0; this.setPos(0); this.v.classList.remove('reel-fade'); }, 260);
          this.phase = 'top'; this.t0 = now + 260;
        }
        if (this.phase !== 'top' || this.y > 0) this.setPos(this.y);
        this.fill.style.transform = `scaleX(${max ? this.y / max : 0})`;
      }
      this.raf = requestAnimationFrame(t => this.tick(t));
    }
    restart() { this.y = 0; this.phase = 'top'; this.t0 = performance.now(); this.setPos(0); this.fill.style.transform = 'scaleX(0)'; }
  }

  function image(img) {
    const v = img.closest('.viewport'); if (!v) return;
    const setPos = y => { img.style.transform = `translate3d(0,${-y}px,0)`; };
    const measure = () => ({ max: Math.max(0, img.getBoundingClientRect().height - v.clientHeight), rate: SPEED });
    if (!img._reel) img._reel = new Runner(v, measure, setPos);
    const go = () => { v.classList.remove('is-loading'); img._reel.restart(); };
    v.classList.add('is-loading');
    if (img.complete && img.naturalHeight) go(); else img.addEventListener('load', go, { once: true });
  }

  function frame(iframe, slug) {
    const v = iframe.closest('.viewport'); if (!v) return;
    iframe.setAttribute('tabindex', '-1');
    // Poster: instant first paint from the long screenshot while the live page loads.
    let poster = v.querySelector('.reel-poster');
    if (!poster) { poster = document.createElement('img'); poster.className = 'reel-poster'; poster.alt = ''; poster.decoding = 'async'; v.insertBefore(poster, v.firstChild); }
    const phone = !!v.closest('.phone') || (v.dataset.mobile !== 'off' && innerWidth <= 680);
    if (slug) poster.src = `examples/${slug}/full-${phone ? 'mobile' : 'desktop'}.webp`;
    const scale = () => { const m = /scale\(([^)]+)\)/.exec(iframe.style.transform || ''); return m ? parseFloat(m[1]) : 1; };
    const win = () => { try { return iframe.contentWindow; } catch { return null; } };
    const measure = () => {
      const w = win(); if (!w || !w.document || !w.document.documentElement) return { max: 0, rate: SPEED };
      return { max: Math.max(0, w.document.documentElement.scrollHeight - w.innerHeight), rate: SPEED / (scale() || 1) };
    };
    const setPos = y => { const w = win(); if (w) w.scrollTo({ top: y, left: 0, behavior: 'instant' }); };
    if (!iframe._reel) {
      iframe._reel = new Runner(v, measure, setPos);
      iframe.addEventListener('load', () => {
        const w = win();
        try { const st = w.document.createElement('style'); st.textContent = 'html{scroll-behavior:auto!important;scrollbar-width:none}::-webkit-scrollbar{display:none}'; w.document.head.appendChild(st); } catch {}
        v.classList.add('is-live'); iframe._reel.restart();
      });
    }
  }

  window.RSReel = { image, frame };

  /* ---------- Industry picker (replaces the native select, keeps it as the value store) ---------- */
  const GROUPS = [
    ['Home & outdoor services', 'tidewater', ['#0E4F5C', '#E7D3A8'], ['pressure washing', 'cleaning', 'landscaping & lawn', 'pool service', 'pest control', 'moving', 'auto detailing']],
    ['Food, retail & events', 'marisol', ['#C2552F', '#F2B8A2'], ['restaurant', 'bakery & cafe', 'food truck & catering', 'retail & boutique', 'event venue']],
    ['Trades & property', 'halden', ['#1F2326', '#B5652B'], ['roofing', 'construction & remodeling', 'painting', 'handyman', 'plumbing', 'electrical', 'tree service', 'real estate']],
    ['Technical & professional', 'northline', ['#13294B', '#FF6B2C'], ['HVAC', 'solar', 'IT & tech services', 'insurance', 'accounting & tax', 'consulting', 'law', 'other professional']],
    ['Health, care & learning', 'juniper', ['#2F5D50', '#DDE8E1'], ['dental', 'medical & clinic', 'wellness & therapy', 'fitness & yoga', 'childcare', 'home care', 'pet care', 'tutoring']],
    ['Personal & creative', 'fadeline', ['#0F0F10', '#C9A24A'], ['barbershop', 'hair & beauty salon', 'nails', 'tattoo', 'photography', 'creative & marketing', 'other']],
  ];
  const cap = s => s.replace(/^./, c => c.toUpperCase()).replace(/\bIt\b/, 'IT').replace(/\bHvac\b/i, 'HVAC');
  let uid = 0;

  function picker(sel, cfg) {
    cfg = cfg || {};
    const groups = cfg.groups || GROUPS, nice = cfg.label || cap, emptyText = cfg.empty || 'Pick your industry', ph = cfg.search || 'Search your industry';
    if (sel._picker) return; sel._picker = true;
    const id = 'ip' + (++uid);
    const wrap = document.createElement('div'); wrap.className = 'ipick';
    const label = sel.closest('label');
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ipick-btn';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', id + '-list');
    btn.innerHTML = '<span class="ipick-swatch" aria-hidden="true"></span><span class="ipick-text"><span class="ipick-value"></span><span class="ipick-hint"></span></span><svg class="ipick-chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>';
    const pop = document.createElement('div'); pop.className = 'ipick-pop'; pop.hidden = true;
    pop.innerHTML = `<div class="ipick-search"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg><input type="text" placeholder="${ph}" aria-label="${ph}" autocomplete="off" spellcheck="false"></div><div class="ipick-list" role="listbox" id="${id}-list" tabindex="-1"></div><p class="ipick-empty" hidden>${cfg.noMatch || 'No match. Pick <button type="button" data-other>Other</button> and describe it on the next step.'}</p>`;
    const list = pop.querySelector('.ipick-list'), search = pop.querySelector('input'), empty = pop.querySelector('.ipick-empty');
    groups.forEach(([name, slug, sw, items]) => {
      const g = document.createElement('div'); g.className = 'ipick-group'; g.setAttribute('role', 'group'); g.setAttribute('aria-label', name);
      g.innerHTML = name ? `<div class="ipick-ghead"><span>${name}</span>${sw ? `<i style="background:${sw[0]}"></i><i style="background:${sw[1]}"></i>` : ''}</div>` : '';
      items.forEach(v => {
        const o = document.createElement('div'); o.className = 'ipick-opt'; o.setAttribute('role', 'option'); o.id = id + '-' + v.replace(/\W+/g, '-');
        o.dataset.value = v; o.dataset.group = name || ''; o.dataset.sw = sw ? sw.join(',') : ''; o.dataset.text = nice(v);
        o.innerHTML = `<span>${nice(v)}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7"/></svg>`;
        g.appendChild(o);
      });
      list.appendChild(g);
    });
    sel.classList.add('ipick-native'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    sel.parentNode.insertBefore(wrap, sel); wrap.append(btn, pop, sel);
    if (label) { const lid = id + '-lab'; const t = label.childNodes[0]; if (t && t.nodeType === 3) { const sp = document.createElement('span'); sp.id = lid; sp.textContent = t.textContent; label.replaceChild(sp, t); btn.setAttribute('aria-labelledby', lid + ' ' + id + '-btnv'); } }
    btn.querySelector('.ipick-value').id = id + '-btnv';
    const opts = () => [...list.querySelectorAll('.ipick-opt')].filter(o => !o.hidden);
    let active = null;
    function paint() {
      const v = sel.value, o = v && list.querySelector(`[data-value="${CSS.escape(v)}"]`);
      btn.querySelector('.ipick-value').textContent = o ? nice(v) : emptyText;
      btn.querySelector('.ipick-hint').textContent = o ? o.dataset.group : '';
      btn.classList.toggle('is-empty', !o);
      const s = btn.querySelector('.ipick-swatch'); s.hidden = !!cfg.noSwatch; s.style.background = o && o.dataset.sw ? `linear-gradient(135deg, ${o.dataset.sw.split(',')[0]} 50%, ${o.dataset.sw.split(',')[1]} 50%)` : '';
      list.querySelectorAll('.ipick-opt').forEach(x => x.setAttribute('aria-selected', String(x === o)));
    }
    function setActive(o) { list.querySelectorAll('.is-active').forEach(x => x.classList.remove('is-active')); active = o; if (o) { o.classList.add('is-active'); o.scrollIntoView({ block: 'nearest' }); search.setAttribute('aria-activedescendant', o.id); } }
    function open() {
      pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); wrap.classList.add('is-open');
      search.value = ''; filter(''); setActive(list.querySelector('[aria-selected="true"]') || opts()[0]);
      setTimeout(() => search.focus(), 0);
    }
    function close(focus = true) { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); wrap.classList.remove('is-open'); if (focus) btn.focus(); }
    function choose(o) {
      if (!o) return; sel.value = o.dataset.value; paint(); close();
      sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function filter(q) {
      q = q.trim().toLowerCase(); let any = false;
      list.querySelectorAll('.ipick-group').forEach(g => {
        let n = 0; g.querySelectorAll('.ipick-opt').forEach(o => { const hit = !q || o.dataset.value.toLowerCase().includes(q) || o.dataset.text.toLowerCase().includes(q) || o.dataset.group.toLowerCase().includes(q); o.hidden = !hit; if (hit) n++; });
        g.hidden = !n; any = any || n > 0;
      });
      empty.hidden = any; setActive(opts()[0] || null);
    }
    btn.onclick = () => (pop.hidden ? open() : close());
    btn.onkeydown = e => { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); open(); } };
    search.oninput = () => filter(search.value);
    search.onkeydown = e => {
      const all = opts(), i = all.indexOf(active);
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(all[Math.min(all.length - 1, i + 1)] || all[0]); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(all[Math.max(0, i - 1)] || all[0]); }
      else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') close(false);
    };
    list.onmousemove = e => { const o = e.target.closest('.ipick-opt'); if (o && o !== active) setActive(o); };
    list.onclick = e => choose(e.target.closest('.ipick-opt'));
    const other = empty.querySelector('[data-other]'); if (other) other.onclick = () => choose(list.querySelector('[data-value="other"]'));
    document.addEventListener('pointerdown', e => { if (!pop.hidden && !wrap.contains(e.target)) close(false); });
    sel.addEventListener('change', paint);
    // site.js validation calls reportValidity() on the hidden select: surface it on the button instead.
    sel.addEventListener('invalid', () => { wrap.classList.add('is-invalid'); btn.focus(); }, true);
    sel.addEventListener('change', () => wrap.classList.remove('is-invalid'));
    paint();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('select[name=industry]:not([data-native])').forEach(s => picker(s));
    const ST = {AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',AS:'American Samoa',GU:'Guam',MP:'Northern Mariana Islands',PR:'Puerto Rico',VI:'U.S. Virgin Islands'};
    document.querySelectorAll('select[name=state]:not([data-native])').forEach(s => picker(s, { groups: [['', null, null, Object.keys(ST)]], label: v => `${ST[v] || v} (${v})`, empty: 'Pick your state', search: 'Search states', noSwatch: true, noMatch: 'No match. Try the full state name.' }));
  });
})();
