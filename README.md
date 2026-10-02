# Life Eventos — site

Site oficial do **Life Eventos**, salão de festas no Capão Raso, Curitiba.
Site estático (HTML, CSS e JavaScript puro), sem build e sem dependências.

## Estrutura

```
index.html            página principal
404.html              página de "não encontrado"
assets/css/style.css  estilos (tema claro + modo escuro)
assets/js/main.js     interações (menu, vídeos, galeria, formulário)
assets/video/         vídeos do site
assets/img/           fotos, logo e ícones
robots.txt, sitemap.xml, site.webmanifest
.github/workflows/deploy.yml  publicação automática no GitHub Pages
```

## Rodar no computador

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## O que editar com frequência

- **WhatsApp e depoimentos:** no topo de `assets/js/main.js`, no objeto `CONFIG`.
  Cole em `reviews` apenas avaliações reais do Google; com a lista vazia a seção
  mostra só a nota e o link para o Google.
- **Cores:** variáveis no topo de `assets/css/style.css` (`:root` para o tema claro,
  `[data-theme="dark"]` para o escuro).
- **Fotos:** ficam em `assets/img/`, cada uma em duas versões: `nome.webp` (até 1600 px)
  e `nome-800.webp` (para miniaturas). Para trocar, substitua os dois arquivos mantendo os nomes.
- **Vídeos:** ficam em `assets/video/` (`.mp4` H.264, sem som, até ~3 MB), com a capa em
  `assets/img/*-poster.webp`. Eles tocam sozinhos, sem som, só quando aparecem na tela.
- **Pacotes e condições:** valores e regras estão no `index.html`, nas seções
  `#pacotes` e `#condicoes`.

## Publicar

### GitHub Pages (já configurado)
1. No GitHub: **Settings → Pages → Source: GitHub Actions**.
2. Cada push na branch `main` publica o site automaticamente.
3. Domínio próprio: crie um arquivo `CNAME` na raiz com `www.espacolifeeventos.com.br`
   e aponte o DNS do domínio para o GitHub Pages.

### Alternativas
Netlify, Vercel ou Cloudflare Pages: basta conectar o repositório; não há comando
de build e a pasta de publicação é a raiz.
