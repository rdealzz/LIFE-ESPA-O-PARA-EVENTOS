# Life Eventos — site

Site oficial do **Life Eventos**, salão de festas no Capão Raso, Curitiba.
Site estático (HTML, CSS e JavaScript), sem etapa de build.

## Estrutura

```
index.html            página principal
404.html              página de "não encontrado"
assets/css/style.css  estilos (tema claro + modo escuro)
assets/js/main.js     interações (tema, menu, animações 3D, mural de fotos, bilhete)
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
- **Fotos:** substitua os arquivos em `assets/img/` mantendo os nomes, ou troque os
  caminhos no `index.html`. Prefira `.webp` com até ~1400 px de largura.

## Modo claro e escuro

O site sempre abre no **modo claro**. O botão de lua/sol no topo troca para o
escuro, e a escolha fica salva no navegador daquela pessoa.

## Animações

As animações 3D (fotos que chegam girando, a "porta" que se abre, o passeio em
carrossel e o mural de fotos) usam GSAP + ScrollTrigger, carregados do cdnjs.
Se a pessoa preferir menos movimento no celular/computador, ou se o GSAP não
carregar, o site aparece completo, só que sem animação.

## Publicar

### GitHub Pages (já configurado)
1. No GitHub: **Settings → Pages → Source: GitHub Actions**.
2. Cada push na branch `main` publica o site automaticamente.
3. Domínio próprio: crie um arquivo `CNAME` na raiz com `www.espacolifeeventos.com.br`
   e aponte o DNS do domínio para o GitHub Pages.

### Alternativas
Netlify, Vercel ou Cloudflare Pages: basta conectar o repositório; não há comando
de build e a pasta de publicação é a raiz.
