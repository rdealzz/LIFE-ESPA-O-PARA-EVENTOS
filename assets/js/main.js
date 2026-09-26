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

  /* ---------- Tema claro / escuro ---------- */
  const THEME_KEY = "life-theme";
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const toggle = $("[data-theme-toggle]");
  const currentTheme = () => root.getAttribute("data-theme") || (systemDark.matches ? "dark" : "light");
  const syncToggle = () => {
    if (!toggle) return;
    const dark = currentTheme() === "dark";
    toggle.setAttribute("aria-label", dark ? "Ativar modo claro" : "Ativar modo escuro");
    toggle.setAttribute("aria-pressed", String(dark));
  };
  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* navegação privada */ }
      syncToggle();
    });
    systemDark.addEventListener("change", syncToggle);
    syncToggle();
  }

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

  /* ---------- Passeio horizontal ---------- */
  const track = $("[data-tour]");
  if (track) {
    const bar = $("[data-tour-bar]");
    const prev = $("[data-tour-prev]");
    const next = $("[data-tour-next]");
    const step = () => {
      const s = $(".scene", track);
      return s ? s.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : track.clientWidth;
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const p = max > 0 ? track.scrollLeft / max : 1;
      const visible = track.clientWidth / track.scrollWidth;
      bar.style.transform = `scaleX(${Math.min(1, visible + p * (1 - visible))})`;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
    };
    prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" }));
    next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" }));
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    track.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") { e.preventDefault(); next.click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev.click(); }
    });
    // Arrastar com o mouse (no toque, a rolagem nativa já resolve)
    let down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener("pointerdown", e => {
      if (e.pointerType !== "mouse") return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
      track.style.scrollSnapType = "none";
    });
    window.addEventListener("pointermove", e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      track.style.scrollSnapType = "";
    });
    track.addEventListener("click", e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    track.addEventListener("dragstart", e => e.preventDefault());
    update();
  }

  /* ---------- Prévia flutuante na lista de eventos ---------- */
  const preview = $("[data-event-preview]");
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (preview && canHover && !reduce) {
    const img = $("img", preview);
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (x - cx) * 0.16; cy += (y - cy) * 0.16;
      preview.style.left = cx + "px"; preview.style.top = cy + "px";
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    const list = $("[data-events]");
    list.addEventListener("pointermove", e => {
      x = e.clientX + 170; y = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    $$(".event", list).forEach(ev => {
      ev.addEventListener("pointerenter", () => { img.src = ev.dataset.img; preview.classList.add("is-visible"); });
      ev.addEventListener("pointerleave", () => preview.classList.remove("is-visible"));
    });
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

    // Clicar num tipo de evento já escolhe a opção no formulário
    $$("[data-evento]").forEach(a => a.addEventListener("click", () => { form.evento.value = a.dataset.evento; }));
  }

  /* ---------- Lightbox da galeria ---------- */
  const box = $("[data-lightbox]");
  const photos = $$(".photo");
  if (box && photos.length) {
    const img = $("img", box);
    const cap = $("figcaption", box);
    let current = 0, lastFocus = null;
    const show = i => {
      current = (i + photos.length) % photos.length;
      const p = photos[current];
      const alt = $("img", p).alt;
      img.src = p.dataset.full; img.alt = alt; cap.textContent = alt;
    };
    const open = i => {
      lastFocus = document.activeElement;
      show(i); box.hidden = false;
      document.body.style.overflow = "hidden";
      $(".lightbox-close", box).focus();
    };
    const close = () => {
      box.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };
    photos.forEach((p, i) => p.addEventListener("click", () => open(i)));
    $(".lightbox-close", box).addEventListener("click", close);
    $(".prev", box).addEventListener("click", () => show(current - 1));
    $(".next", box).addEventListener("click", () => show(current + 1));
    box.addEventListener("click", e => { if (e.target === box || e.target.tagName === "FIGURE") close(); });
    // Deslizar no celular
    let sx = null;
    box.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      sx = null;
    });
    document.addEventListener("keydown", e => {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
      if (e.key === "Tab") { // mantém o foco dentro do lightbox
        const f = $$("button", box); const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
