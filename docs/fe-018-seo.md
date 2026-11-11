# FE-018 — metadata, sitemap, robots e canonical

As rotas especiais do App Router ficam em `src/app/robots.ts` e `src/app/sitemap.ts`. A metadata da página pública usa canonical relativo à origem configurada. O parser comum fica em `src/features/seo/site-url.mjs`.

## Configuração de produção

Defina `SITE_URL` na aplicação com a origem HTTPS pública aprovada, por exemplo `https://portal.instituicao.br`. O valor deve conter apenas a origem: sem caminho, credenciais, query ou fragmento. O endereço definitivo depende da conclusão da decisão de domínio/certificado de INF-025 ou INF-011.

Sem uma origem válida, a página recebe `noindex`, o sitemap fica vazio e `robots.txt` bloqueia a indexação. Em produção, HTTP e localhost também são recusados. Essa proteção evita publicar canonical localhost ou URLs incorretas.

## Escopo público

O sitemap lista somente a rota pública conhecida (`/`). As áreas de aluno, docente, coordenação, administração, login, recuperação e API são bloqueadas em `robots.txt`. Ao integrar novas rotas públicas, inclua-as explicitamente no sitemap após validar que não contêm dados autenticados.

Robots é uma orientação para crawlers, não uma barreira de autorização; páginas privadas continuam dependendo da autenticação e autorização do servidor.

## Validação pendente de ambiente

Os testes verificam origem, canonical, sitemap, bloqueios e comportamento fail-closed sem domínio. Confirmar os endereços finais e a indexação em produção depende da configuração de domínio/certificado e da integração das rotas públicas de FE-015/FE-016.
