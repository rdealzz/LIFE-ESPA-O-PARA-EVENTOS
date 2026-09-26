/* =========================================================
   Life Eventos — interações
   GSAP + ScrollTrigger fazem as animações 3D. Se não carregarem
   (ou se a pessoa preferir menos movimento), o site funciona
   normalmente, só que parado.
   ========================================================= */
(() => {
  "use strict";

  /* ---------- Configuração fácil de editar ---------- */
  const CONFIG = {
    whatsapp: "5541999813709",
    // Cole aqui depoimentos REAIS do Google. Com a lista vazia, a seção
    // mostra só a nota e o link para as avaliações.
    // Exemplo: { text: "Espaço lindo e novinho...", name: "Maria S.", event: "Aniversário" }
    reviews: []
  };

  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const motion = hasGSAP && !reduce;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  if (motion) root.classList.add("motion");

  /* O passeio 3D precisa de WebGL. Decide logo no início para o menu apontar
     "O espaço" para ele e o carrossel virar plano B. */
  const walkEl = $("[data-walk]");
  const tourEl = $("[data-tour]");
  const hasWebGL = (() => {
    try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); }
    catch (e) { return false; }
  })();
  let walkOn = motion && hasWebGL && !!walkEl;
  const disableWalk = () => {
    walkOn = false;
    root.classList.remove("walk-on");
    walkEl.hidden = true; walkEl.removeAttribute("id"); tourEl.id = "espaco";
  };
  if (walkOn) {
    root.classList.add("walk-on");
    walkEl.hidden = false;
    tourEl.removeAttribute("id"); walkEl.id = "espaco";
  }

  /* ---------- Tema: claro por padrão, escuro só se escolher ---------- */
  const THEME_KEY = "life-theme";
  const toggle = $("[data-theme-toggle]");
  const isDark = () => root.getAttribute("data-theme") === "dark";
  const syncToggle = () => {
    toggle.setAttribute("aria-label", isDark() ? "Ativar modo claro" : "Ativar modo escuro");
    toggle.setAttribute("aria-pressed", String(isDark()));
  };
  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      if (next === "dark") root.setAttribute("data-theme", "dark");
      else root.removeAttribute("data-theme");
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* navegação privada */ }
      syncToggle();
    });
    syncToggle();
  }

  /* ---------- Topo ---------- */
  const top = $("[data-top]");
  const onScroll = () => top.classList.toggle("is-scrolled", window.scrollY > 30);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  const burger = $("[data-burger]");
  const menu = $("#menu");
  const setMenu = open => {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  };
  if (burger && menu) {
    burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
    $$("a", menu).forEach(a => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", e => { if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); burger.focus(); } });
    window.matchMedia("(min-width: 961px)").addEventListener("change", e => { if (e.matches) setMenu(false); });
  }

  /* ---------- Link ativo no menu ---------- */
  const links = $$('.menu a[href^="#"]:not(.btn)');
  const targets = links.map(a => $(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && targets.length) {
    const spy = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) links.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    targets.forEach(s => spy.observe(s));
  }

  /* ---------- Passeio pelos ambientes (carrossel 3D) ---------- */
  const tour = $("[data-tour]");
  const track = $("[data-tour-track]");
  const rooms = $$(".room", track);
  const bar = $("[data-tour-bar]");
  const prevBtn = $("[data-tour-prev]");
  const nextBtn = $("[data-tour-next]");
  let deskX = 0, deskMode = false;

  // Gira e afasta cada foto conforme a distância do centro da tela
  const coverflow = () => {
    const vw = window.innerWidth;
    const shift = deskMode ? deskX : -track.scrollLeft;
    rooms.forEach(r => {
      const c = r.offsetLeft + r.offsetWidth / 2 + shift;
      const d = clamp((c - vw / 2) / (vw / 2), -1.6, 1.6);
      if (!motion) return;
      const k = deskMode ? 1 : 0.65;
      r.style.transform = `translate3d(0, ${Math.abs(d) * 28 * k}px, ${-Math.abs(d) * 240 * k}px) rotateY(${-d * 34 * k}deg)`;
      r.style.opacity = String(1 - Math.min(Math.abs(d), 1.4) * 0.3);
    });
  };
  const updateNative = () => {
    const max = track.scrollWidth - track.clientWidth;
    const p = max > 0 ? track.scrollLeft / max : 1;
    bar.style.transform = `scaleX(${0.2 + p * 0.8})`;
    prevBtn.disabled = track.scrollLeft <= 2;
    nextBtn.disabled = track.scrollLeft >= max - 2;
    coverflow();
  };
  if (track) {
    const step = () => rooms[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
    prevBtn.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" }));
    nextBtn.addEventListener("click", () => track.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" }));
    let ticking = false;
    track.addEventListener("scroll", () => {
      if (deskMode || ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; updateNative(); });
    }, { passive: true });
    track.addEventListener("keydown", e => {
      if (deskMode) return;
      if (e.key === "ArrowRight") { e.preventDefault(); nextBtn.click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prevBtn.click(); }
    });
    window.addEventListener("resize", () => { if (!deskMode) updateNative(); });
    updateNative();
  }

  /* ---------- Depoimentos ---------- */
  const row = $("[data-reviews]");
  if (row && CONFIG.reviews.length) {
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    row.innerHTML = CONFIG.reviews.map(r => `
      <figure class="review">
        <div class="stars" aria-label="5 de 5 estrelas">★★★★★</div>
        <blockquote>“${esc(r.text)}”</blockquote>
        <cite>${esc(r.name)}${r.event ? ", " + esc(r.event) : ""}</cite>
      </figure>`).join("");
    row.hidden = false;
  }
  const year = $("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Bilhete que vira mensagem no WhatsApp ---------- */
  const form = $("[data-form]");
  if (form) {
    const t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
    form.data.min = t.toISOString().slice(0, 10);
    const err = $(".form-error", form);
    const fail = (field, msg) => {
      err.textContent = msg; err.hidden = false;
      field.setAttribute("aria-invalid", "true");
      field.focus();
      if (motion) gsap.fromTo(form, { x: -8 }, { x: 0, duration: .5, ease: "elastic.out(1, .3)" });
    };
    $$("input, select, textarea", form).forEach(f => f.addEventListener("input", () => f.removeAttribute("aria-invalid")));

    form.addEventListener("submit", e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      const nome = (d.nome || "").trim();
      if (!nome) return fail(form.nome, "Escreva seu nome no bilhete pra gente saber com quem está falando.");
      if (!d.evento) return fail(form.evento, "Escolha qual festa você quer fazer.");
      const n = Number(d.convidados);
      if (d.convidados && (!Number.isFinite(n) || n < 1 || n > 60)) return fail(form.convidados, "O espaço recebe de 1 a 60 convidados.");
      err.hidden = true;

      const data = d.data ? new Date(d.data + "T12:00").toLocaleDateString("pt-BR") : "a combinar";
      const msg = [
        `Olá! Meu nome é ${nome} e vi o site do Life Eventos.`,
        `Quero fazer: ${d.evento}`,
        `Data: ${data}`,
        d.convidados ? `Convidados: ${d.convidados}` : "",
        d.obs && d.obs.trim() ? `Obs.: ${d.obs.trim()}` : "",
        "Pode me passar valores e disponibilidade?"
      ].filter(Boolean).join("\n");
      window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    });

    // Clicar numa festa já preenche o bilhete
    $$("[data-evento]").forEach(a => a.addEventListener("click", () => {
      form.evento.value = a.dataset.evento;
      form.evento.removeAttribute("aria-invalid");
    }));
  }

  /* ---------- Fotos ampliadas ---------- */
  const box = $("[data-lightbox]");
  const shots = $$(".shot");
  if (box && shots.length) {
    const card = $(".lightbox-card", box);
    const img = $("img", box);
    const cap = $("figcaption", box);
    let current = 0, lastFocus = null;
    const fill = i => {
      current = (i + shots.length) % shots.length;
      const s = shots[current];
      img.src = s.dataset.full; img.alt = $("img", s).alt; cap.textContent = $(".shot-cap", s).textContent;
    };
    const show = (i, dir) => {
      if (!motion) return fill(i);
      gsap.to(card, {
        rotationY: dir * -80, opacity: 0, duration: .28, ease: "power2.in",
        onComplete: () => { fill(i); gsap.fromTo(card, { rotationY: dir * 80, opacity: 0 }, { rotationY: 0, opacity: 1, duration: .55, ease: "expo.out" }); }
      });
    };
    const open = i => {
      lastFocus = document.activeElement;
      fill(i); box.hidden = false;
      document.body.style.overflow = "hidden";
      $(".lightbox-close", box).focus();
      if (motion) {
        gsap.fromTo(box, { opacity: 0 }, { opacity: 1, duration: .35 });
        gsap.fromTo(card, { rotationX: 35, rotationY: -40, scale: .55, y: 80, opacity: 0 }, { rotationX: 0, rotationY: 0, scale: 1, y: 0, opacity: 1, duration: 1, ease: "expo.out" });
      }
    };
    const close = () => {
      const done = () => { box.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); };
      if (!motion) return done();
      gsap.to(card, { rotationX: -25, scale: .8, y: 60, opacity: 0, duration: .35, ease: "power2.in" });
      gsap.to(box, { opacity: 0, duration: .35, delay: .05, onComplete: done });
    };
    shots.forEach((s, i) => s.addEventListener("click", () => open(i)));
    $(".lightbox-close", box).addEventListener("click", close);
    $(".prev", box).addEventListener("click", () => show(current - 1, -1));
    $(".next", box).addEventListener("click", () => show(current + 1, 1));
    box.addEventListener("click", e => { if (e.target === box) close(); });
    let sx = null;
    box.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      sx = null;
    });
    document.addEventListener("keydown", e => {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(current - 1, -1);
      if (e.key === "ArrowRight") show(current + 1, 1);
      if (e.key === "Tab") {
        const f = $$("button", box); const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  if (!motion) return;

  /* =========================================================
     ANIMAÇÕES 3D
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);

  /* ---- 1. Hero: as polaroids chegam girando em profundidade ---- */
  const heroText = $$(".hero .reveal");
  gsap.set(heroText, { opacity: 1 });
  gsap.from(heroText, { y: 40, opacity: 0, duration: 1.2, stagger: .1, ease: "expo.out", delay: .1 });
  gsap.from(".marked svg path", { strokeDasharray: 260, strokeDashoffset: 260, duration: 1.4, delay: .9, ease: "power2.inOut" });

  const polas = $$(".polaroid");
  gsap.from(polas, {
    opacity: 0, y: 220, z: -700,
    rotationX: 75, rotationY: i => [-45, 25, 50][i] || 0,
    duration: 1.8, stagger: .16, ease: "expo.out", delay: .25,
    // Depois que chegam, ao rolar as fotos se abrem em leque no espaço
    onComplete: () => {
      const k = () => (innerWidth < 861 ? 0.35 : 1); // no celular o leque é mais contido
      gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1, invalidateOnRefresh: true } })
        .to(".p-back", { x: () => 60 * k(), y: () => -90 * k(), z: () => -180 * k(), rotationY: () => -22 * k(), ease: "none" }, 0)
        .to(".p-main", { y: () => -30 * k(), z: () => 60 * k(), rotationX: 8, ease: "none" }, 0)
        .to(".p-front", { x: () => -50 * k(), y: () => 80 * k(), z: () => 220 * k(), rotationY: () => 28 * k(), ease: "none" }, 0);
    }
  });

  // A pilha acompanha o mouse
  if (finePointer) {
    const stack = $("[data-hero-stack]");
    const rX = gsap.quickTo(stack, "rotationX", { duration: .9, ease: "power3" });
    const rY = gsap.quickTo(stack, "rotationY", { duration: .9, ease: "power3" });
    $(".hero").addEventListener("pointermove", e => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      rY(nx * 16); rX(-ny * 12);
    });
    $(".hero").addEventListener("pointerleave", () => { rX(0); rY(0); });
  }

  /* ---- 2. Passeio 3D pelo local (Three.js + profundidade gerada por IA) ----
     Se o aparelho não tiver WebGL, ou se o 3D não carregar, entra o plano B:
     a porta que se abre e o carrossel dos ambientes. */
  function planB() {
    /* ---- 2. A porta: a foto se abre em 3D até ocupar a tela ---- */
    const frame = $("[data-door-frame]");
    gsap.set(frame, { rotationX: 28, transformPerspective: 1200 });
    gsap.timeline({
      scrollTrigger: { trigger: "[data-door]", start: "top top", end: "+=160%", scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true }
    })
      .to("[data-door-hint]", { opacity: 0, duration: .15 }, 0)
      .to(frame, { rotationX: 0, duration: .35, ease: "power2.out" }, 0)
      .to(frame, { width: () => innerWidth, height: () => innerHeight, borderRadius: 0, duration: 1, ease: "power2.inOut" }, .25)
      .to(".door-frame img", { scale: 1, duration: 1.1, ease: "none" }, .15)
      .to(".door-shade", { opacity: .6, duration: .6 }, .6)
      .fromTo("[data-door-welcome]", { opacity: 0, scale: .7, y: 60, rotationX: 60 }, { opacity: 1, scale: 1, y: 0, rotationX: 0, duration: .5, ease: "back.out(1.6)" }, .8)
      .to({}, { duration: .3 });

    /* ---- 3. Passeio: no computador, a rolagem move o carrossel 3D ---- */
    const mm = gsap.matchMedia();
    mm.add("(min-width: 861px)", () => {
      deskMode = true;
      root.classList.add("motion-desk");
      const first = rooms[0], last = rooms[rooms.length - 1];
      const startX = () => innerWidth / 2 - (first.offsetLeft + first.offsetWidth / 2);
      const distance = () => (last.offsetLeft + last.offsetWidth / 2) - (first.offsetLeft + first.offsetWidth / 2);
      const apply = p => {
        deskX = startX() - distance() * p;
        track.style.transform = `translate3d(${deskX}px, 0, 0)`;
        bar.style.transform = `scaleX(${0.2 + p * 0.8})`;
        coverflow();
      };
      track.scrollLeft = 0;
      const st = ScrollTrigger.create({
        trigger: tour, start: "top top", end: () => "+=" + distance() * 1.1,
        pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: self => apply(self.progress),
        onRefresh: self => apply(self.progress)
      });
      apply(0);
      return () => {
        deskMode = false;
        root.classList.remove("motion-desk");
        track.style.transform = "";
        st.kill();
        updateNative();
      };
    });
    mm.add("(max-width: 860px)", () => { updateNative(); });
  }

  const loadScript = src => new Promise((ok, fail) => {
    const sc = document.createElement("script");
    sc.src = src; sc.onload = ok; sc.onerror = fail;
    document.head.appendChild(sc);
  });
  if (walkOn) {
    loadScript("assets/js/vendor/three.min.js")
      .then(() => loadScript("assets/js/walk.js"))
      .then(() => window.LifeWalk.init(walkEl))
      .catch(() => { disableWalk(); planB(); ScrollTrigger.refresh(); });
  } else {
    planB();
  }

  /* ---- 4. Mural: cada foto se abre como um cartão ---- */
  gsap.set(".shot", { opacity: 0 });
  ScrollTrigger.batch(".shot", {
    start: "top 90%", once: true,
    onEnter: batch => gsap.fromTo(batch,
      { opacity: 0, rotationX: -80, y: 90, z: -200, transformOrigin: "50% 0%" },
      { opacity: 1, rotationX: 0, y: 0, z: 0, duration: 1.4, stagger: .12, ease: "expo.out", clearProps: "transform" })
  });

  /* ---- 5. Bilhetes de festa: viram de lado, como cartas ---- */
  gsap.set(".tickets > li", { opacity: 0 });
  ScrollTrigger.batch(".tickets > li", {
    start: "top 88%", once: true,
    onEnter: batch => gsap.fromTo(batch,
      { opacity: 0, rotationY: -70, x: -40, transformOrigin: "0% 50%", transformPerspective: 1000 },
      { opacity: 1, rotationY: 0, x: 0, duration: 1.2, stagger: .1, ease: "expo.out", clearProps: "transform" })
  });

  /* ---- 6. Cartões (checklist, passos, bilhete, mapa) caem na mesa ---- */
  $$(".note-card, .step-list li, .letter, .map, .love-card").forEach(el => {
    gsap.set(el, { opacity: 0 });
    gsap.fromTo(el,
      { opacity: 0, y: 70, rotationX: 35, rotationZ: -4, transformPerspective: 1100, transformOrigin: "50% 100%" },
      { opacity: 1, y: 0, rotationX: 0, rotationZ: 0, duration: 1.3, ease: "expo.out", clearProps: "transform",
        scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  /* ---- 7. Textos entram suavemente ---- */
  const cardLike = ".hero .reveal, .note-card, .letter, .map, .love-card, .tickets > li, .step-list li";
  ScrollTrigger.batch($$(".reveal").filter(el => !el.matches(cardLike)), {
    start: "top 90%", once: true,
    onEnter: batch => gsap.fromTo(batch, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 1.1, stagger: .08, ease: "expo.out" })
  });

  /* ---- 8. Inclinação 3D ao passar o mouse ---- */
  if (finePointer) {
    $$("[data-tilt], .shot").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
        gsap.to(el, { rotationY: nx * 12, rotationX: -ny * 10, transformPerspective: 900, duration: .6, ease: "power3" });
      });
      el.addEventListener("pointerleave", () => gsap.to(el, { rotationY: 0, rotationX: 0, duration: .9, ease: "power3" }));
    });
  }

  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
