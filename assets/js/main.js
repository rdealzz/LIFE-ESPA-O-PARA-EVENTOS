/* =========================================================
   Life Eventos — interações
   JavaScript puro, sem dependências. Tudo funciona sem
   animação para quem prefere menos movimento.
   ========================================================= */
(() => {
  "use strict";

  /* ---------- Configuração fácil de editar ---------- */
  const CONFIG = {
    whatsapp: "5541999813709",
    // Cole aqui depoimentos REAIS do Google. Enquanto a lista estiver vazia,
    // a seção mostra só a nota e o link para as avaliações.
    // Exemplo: { text: "Espaço lindo e novinho...", name: "Maria S.", event: "Aniversário" }
    reviews: []
  };

  const root = document.documentElement;
  root.classList.add("js");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Topo: vidro ao rolar ---------- */
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
  const sections = links.map(a => $(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(s => spy.observe(s));
  }

  /* ---------- Animações de entrada ---------- */
  const reveals = $$(".reveal");
  if (!reduce && "IntersectionObserver" in window) {
    // Atraso escalonado entre irmãos
    reveals.forEach(el => {
      const sibs = [...el.parentElement.children].filter(c => c.classList.contains("reveal"));
      const i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty("--d", Math.min(i, 6) * 0.08 + "s");
    });
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add("is-in"));
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

  /* ---------- Formulário que abre o WhatsApp ---------- */
  const form = $("[data-form]");
  if (form) {
    const dateInput = form.data;
    if (dateInput) {
      const t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
      dateInput.min = t.toISOString().slice(0, 10);
    }
    const err = $(".form-error", form);
    const fail = (field, msg) => {
      err.textContent = msg; err.hidden = false;
      field.setAttribute("aria-invalid", "true");
      field.focus();
    };
    $$("input, select, textarea", form).forEach(f => f.addEventListener("input", () => f.removeAttribute("aria-invalid")));

    form.addEventListener("submit", e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      const nome = (d.nome || "").trim();
      if (!nome) return fail(form.nome, "Escreva seu nome para continuar.");
      if (!d.evento) return fail(form.evento, "Escolha o tipo de evento.");
      const n = Number(d.convidados);
      if (d.convidados && (!Number.isFinite(n) || n < 1 || n > 80)) return fail(form.convidados, "O espaço recebe de 1 a 80 convidados.");
      err.hidden = true;

      const data = d.data ? new Date(d.data + "T12:00").toLocaleDateString("pt-BR") : "a combinar";
      const msg = [
        `Olá! Meu nome é ${nome} e vi o site do Life Eventos.`,
        `Quero fazer: ${d.evento}`,
        d.pacote ? `Pacote: ${d.pacote}` : "",
        `Data: ${data}`,
        d.convidados ? `Convidados: ${d.convidados}` : "",
        d.obs && d.obs.trim() ? `Obs.: ${d.obs.trim()}` : "",
        "Pode me passar valores e disponibilidade?"
      ].filter(Boolean).join("\n");
      window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    });

    // Clicar num tipo de evento já escolhe a opção no formulário
    $$("[data-evento]").forEach(a => a.addEventListener("click", () => { form.evento.value = a.dataset.evento; }));
    $$("[data-pacote]").forEach(a => a.addEventListener("click", () => { form.pacote.value = a.dataset.pacote; }));
  }

  /* ---------- Vídeos: tocam sem som só quando aparecem na tela ---------- */
  const autoVideos = $$("video[data-autoplay]");
  if (autoVideos.length) {
    const play = v => { const p = v.play(); if (p) p.catch(() => {}); };
    if (reduce || !("IntersectionObserver" in window)) {
      autoVideos.forEach(v => v.removeAttribute("loop"));
    } else {
      const vio = new IntersectionObserver(entries => {
        entries.forEach(en => {
          const v = en.target;
          if (en.isIntersecting) { if (v.preload === "none") v.preload = "auto"; play(v); }
          else v.pause();
        });
      }, { threshold: 0.25 });
      autoVideos.forEach(v => vio.observe(v));
    }
  }

  /* ---------- Visualizador de fotos e vídeos ---------- */
  const box = $("[data-lightbox]");
  if (box) {
    const img = $("img", box);
    const vid = $("video", box);
    const cap = $("figcaption", box);
    const photos = $$(".photo");
    let current = 0, lastFocus = null;
    const show = i => {
      current = (i + photos.length) % photos.length;
      const p = photos[current];
      const alt = $("img", p).alt;
      img.src = p.dataset.full; img.alt = alt; cap.textContent = alt;
    };
    const openBox = isVideo => {
      lastFocus = document.activeElement;
      box.classList.toggle("is-video", isVideo);
      img.hidden = isVideo; vid.hidden = !isVideo;
      box.hidden = false;
      document.body.style.overflow = "hidden";
      $(".lightbox-close", box).focus();
    };
    const close = () => {
      box.hidden = true;
      vid.pause(); vid.removeAttribute("src"); vid.load();
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };
    photos.forEach((p, i) => p.addEventListener("click", () => { show(i); openBox(false); }));
    $$("[data-film]").forEach(b => b.addEventListener("click", () => {
      const c = $(".film-cap b", b);
      cap.textContent = c ? c.textContent : "";
      vid.poster = b.dataset.poster || "";
      vid.src = b.dataset.film;
      openBox(true);
      const p = vid.play(); if (p) p.catch(() => {});
    }));
    $(".lightbox-close", box).addEventListener("click", close);
    $(".prev", box).addEventListener("click", () => show(current - 1));
    $(".next", box).addEventListener("click", () => show(current + 1));
    box.addEventListener("click", e => { if (e.target === box || e.target.tagName === "FIGURE") close(); });
    // Deslizar no celular
    let sx = null;
    box.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", e => {
      if (sx === null || box.classList.contains("is-video")) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      sx = null;
    });
    document.addEventListener("keydown", e => {
      if (box.hidden) return;
      const isVideo = box.classList.contains("is-video");
      if (e.key === "Escape") close();
      if (!isVideo && e.key === "ArrowLeft") show(current - 1);
      if (!isVideo && e.key === "ArrowRight") show(current + 1);
      if (e.key === "Tab") { // mantém o foco dentro do visualizador
        const f = $$("button, video", box).filter(el => !el.hidden && el.offsetParent !== null);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
