/* =========================================================
   Life Eventos — passeio 3D pelo local
   Cada foto real do espaço vira uma superfície 3D: um modelo de IA
   (Depth Anything V2) estimou a distância de cada ponto da foto, e
   esse "mapa de profundidade" (assets/img/depth/*.webp) empurra a
   imagem para frente ou para trás. Rolar a página move a câmera
   para dentro de cada ambiente e atravessa para o próximo.
   Carregado pelo main.js só quando o aparelho tem WebGL.
   ========================================================= */
(() => {
  "use strict";

  // Ordem do passeio (edite textos à vontade)
  const ROOMS = [
    { img: "recepcao", step: "chegando...", title: "A recepção", text: "Portas de vidro, poltronas e banheiros caprichados pra receber cada convidado." },
    { img: "salao", depth: 0.34, step: "entrando no salão", title: "O salão", text: "Amplo, clarinho e com pé-direito alto. Cabem as mesas redondas, a pista e a mesa do bolo com folga." },
    { img: "decoracao", step: "do seu jeitinho", title: "A decoração", text: "O espaço fica prontinho pra receber a sua decoração, do painel de balões à mesa do bolo." },
    { img: "jogos", step: "a parte preferida das crianças", title: "A área de jogos", text: "Pebolim, fliperama e basquete. As crianças amam (e os adultos também não resistem)." },
    { img: "sala-estar", step: "pra respirar um pouquinho", title: "A sala de estar", text: "Um canto mais tranquilo, com sofá, mesa e TV, pra descansar ou organizar os detalhes." },
    { img: "festa", step: "e aí é só celebrar", title: "A festa", text: "Casa cheia, gente querida e o espaço todinho seu." }
  ];

  const GAP = 6;        // distância entre um ambiente e o próximo
  const START = 4.2;    // de onde a câmera vê cada foto "emoldurada"
  const DEPTH = 0.62;   // força do relevo 3D
  // Percurso dentro de cada ambiente: [fração do trecho, distância até a foto]
  // (desacelera perto da foto para dar tempo de olhar, depois atravessa)
  const PATH = [[0, START], [0.24, 2.7], [0.56, 2.0], [0.8, 0.35], [1, START - GAP]];

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const k = clamp((v - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
  const distAt = u => {
    for (let i = 1; i < PATH.length; i++) {
      if (u <= PATH[i][0]) {
        const [u0, d0] = PATH[i - 1], [u1, d1] = PATH[i];
        return d0 + (d1 - d0) * smooth(0, 1, (u - u0) / (u1 - u0));
      }
    }
    return PATH[PATH.length - 1][1];
  };

  const VERT = `
    uniform sampler2D uDepth;
    uniform float uDepthAmt;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 p = position;
      p.z += texture2D(uDepth, uv).r * uDepthAmt;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`;
  const FRAG = `
    uniform sampler2D uMap;
    uniform float uOpacity;
    uniform vec3 uFog;
    uniform float uFogAmt;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(uMap, vUv);
      vec2 e = smoothstep(0.0, 0.045, vUv) * smoothstep(0.0, 0.045, 1.0 - vUv);
      gl_FragColor = vec4(mix(c.rgb, uFog, uFogAmt), uOpacity * e.x * e.y);
    }`;

  function init(section) {
    const THREE = window.THREE;
    const $ = s => section.querySelector(s);
    const canvas = $("[data-walk-canvas]");
    const intro = $("[data-walk-intro]");
    const note = $("[data-walk-note]");
    const end = $("[data-walk-end]");
    const dotsEl = $("[data-walk-dots]");
    const small = Math.min(innerWidth, innerHeight) < 700;
    const N = ROOMS.length;

    dotsEl.innerHTML = ROOMS.map(() => "<li></li>").join("");
    const dots = [...dotsEl.children];

    /* ---------- Cena ---------- */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 60);

    const paperColor = () => new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#FAF6EF");
    let bg = paperColor();
    renderer.setClearColor(bg);

    const loader = new THREE.TextureLoader();
    const load = url => new Promise((ok, fail) => loader.load(url, t => { t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; ok(t); }, undefined, fail));

    const planes = ROOMS.map((room, i) => {
      const uniforms = {
        uMap: { value: null }, uDepth: { value: null },
        uDepthAmt: { value: room.depth || DEPTH }, uOpacity: { value: 0 },
        uFog: { value: bg.clone() }, uFogAmt: { value: 1 }
      };
      const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      mesh.position.set(i % 2 ? 0.14 : -0.14, 0, -i * GAP);
      mesh.rotation.y = i % 2 ? -0.05 : 0.05;
      mesh.visible = false;
      scene.add(mesh);
      Promise.all([load(`assets/img/${room.img}.webp`), load(`assets/img/depth/${room.img}.webp`)]).then(([map, depth]) => {
        const aspect = map.image.width / map.image.height;
        const w = aspect < 1 ? 2.35 * aspect : 3.5, h = aspect < 1 ? 2.35 : 3.5 / aspect;
        const seg = small ? 110 : 190;
        mesh.geometry.dispose();
        mesh.geometry = aspect < 1
          ? new THREE.PlaneGeometry(w, h, Math.round(seg * aspect), seg)
          : new THREE.PlaneGeometry(w, h, seg, Math.round(seg / aspect));
        uniforms.uMap.value = map; uniforms.uDepth.value = depth;
        mesh.userData.ready = true;
        if (i === 0) { section.classList.add("is-ready"); render(); }
      }).catch(() => { /* foto que não carregou fica de fora */ });
      return { mesh, uniforms };
    });

    // Poeirinha dourada flutuando no ar
    const P = small ? 220 : 420;
    const pos = new Float32Array(P * 3);
    for (let i = 0; i < P; i++) {
      pos[i * 3] = (Math.random() - .5) * 8;
      pos[i * 3 + 1] = (Math.random() - .5) * 5;
      pos[i * 3 + 2] = 6 - Math.random() * (N * GAP + 8);
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xC9A15E, size: small ? 0.03 : 0.022, transparent: true, opacity: .55, depthWrite: false }));
    scene.add(dust);

    /* ---------- Tamanho ---------- */
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 0.8 ? 58 : 50;
      camera.updateProjectionMatrix();
      render();
    };
    window.addEventListener("resize", resize);

    // Tema claro/escuro: o "ar" da cena acompanha
    new MutationObserver(() => {
      bg = paperColor();
      renderer.setClearColor(bg);
      planes.forEach(pl => pl.uniforms.uFog.value.copy(bg));
      render();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    /* ---------- Mouse / toque: a câmera olha em volta ---------- */
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener("pointermove", e => {
      mouse.tx = e.clientX / innerWidth - .5;
      mouse.ty = e.clientY / innerHeight - .5;
    }, { passive: true });

    /* ---------- Rolagem controla o passeio ---------- */
    const state = { p: 0 };
    let current = -1, raf = 0, pinned = false, near = false;
    const isActive = () => pinned || near;
    const wake = () => { if (isActive() && !raf) raf = requestAnimationFrame(loop); };

    const setNote = idx => {
      if (idx === current) return;
      current = idx;
      dots.forEach((d, i) => d.classList.toggle("is-on", i === idx));
      const r = ROOMS[idx];
      gsap.to(note, {
        opacity: 0, y: 14, duration: .2, overwrite: true,
        onComplete: () => {
          $("[data-walk-step]").textContent = `${idx + 1} de ${N} · ${r.step}`;
          $("[data-walk-title]").textContent = r.title;
          $("[data-walk-text]").textContent = r.text;
          gsap.to(note, { opacity: 1, y: 0, duration: .55, ease: "expo.out" });
        }
      });
    };

    function render() {
      const p = state.p;
      const tMax = (N - 1) + 0.56;
      const t = clamp((p - 0.05) / 0.85, 0, 1) * tMax;
      let camZ;
      if (p < 0.05) camZ = START + 1.4 * (1 - p / 0.05);
      else {
        const i = Math.min(Math.floor(t), N - 1);
        camZ = -i * GAP + distAt(t - i);
      }
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      const sx = Math.sin(t * 1.3) * 0.18 + mouse.x * 0.34;
      const sy = 0.02 + Math.cos(t * 0.9) * 0.06 - mouse.y * 0.2;
      camera.position.set(sx, sy, camZ);
      camera.lookAt(sx * 0.2 - mouse.x * 0.5, sy * 0.2 + mouse.y * 0.3, camZ - 6);

      planes.forEach(({ mesh, uniforms }) => {
        const d = camZ - mesh.position.z;
        const op = d <= 0 ? 0 : smooth(0.3, 1.25, d);
        uniforms.uOpacity.value = op;
        uniforms.uFogAmt.value = smooth(4.6, 16, d) * 0.96;
        mesh.visible = !!mesh.userData.ready && op > 0.002 && d < 22;
      });
      dust.rotation.z += 0.0004;

      // textos por cima da cena
      intro.style.opacity = String(1 - smooth(0, 0.045, p));
      intro.style.transform = `translateY(${-p * 900}px)`;
      const endK = smooth(0.9, 0.97, p);
      end.style.opacity = String(endK);
      end.style.visibility = endK > 0.01 ? "visible" : "hidden";
      dotsEl.style.opacity = String((1 - endK) * smooth(0.02, 0.06, p));
      if (p < 0.035 || endK > 0.3) { if (note.style.opacity !== "0") gsap.to(note, { opacity: 0, y: 14, duration: .3, overwrite: true }); current = -1; dots.forEach(d => d.classList.remove("is-on")); }
      else setNote(clamp(Math.floor(t + 0.3), 0, N - 1));

      renderer.render(scene, camera);
    }

    const loop = () => {
      render();
      raf = isActive() ? requestAnimationFrame(loop) : 0;
    };

    gsap.to(state, {
      p: 1, ease: "none",
      scrollTrigger: {
        trigger: section, start: "top top",
        end: () => "+=" + Math.round(innerHeight * N * 0.95),
        pin: true, scrub: 1.2, anticipatePin: 1, invalidateOnRefresh: true,
        onToggle: self => { pinned = self.isActive; wake(); }
      }
    });
    // também anima quando a seção está chegando na tela (antes de fixar)
    ScrollTrigger.create({
      trigger: section, start: "top bottom", end: "bottom top",
      onToggle: self => { near = self.isActive; wake(); }
    });

    resize();
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

  window.LifeWalk = { init };
})();
