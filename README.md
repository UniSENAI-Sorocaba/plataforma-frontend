# Plataforma Digital — Frontend

Aplicação Next.js 16 com TypeScript e App Router. O bootstrap atende à base de `FE-001`: SSR, lint, checagem de tipos, teste e build.

## Estrutura

- `src/app`: rotas e composição SSR;
- `src/components`: componentes compartilhados acessíveis;
- `src/features`: auth, Projetos Integradores, Extensão e Portal.

## Desenvolvimento

```bash
npm install
npm run dev
npm run check
```

A página inicial é um Server Component por padrão. Use Client Components somente onde houver interação no navegador.

## Governança

A tag de `.governance-baseline` ainda precisa ser publicada e apontar para o SHA registrado; o gate remoto de spec-compliance depende dessa ação organizacional.

## Entregas de frontend em revisão

Consulte [docs/entrega-nicolas.md](docs/entrega-nicolas.md) para FE-005, FE-015,
FE-020 e o protótipo futuro FE-025. O catálogo usa dados sintéticos por padrão,
com indicação visual. Prévia de sessão e CPA exigem flags explícitas; não são
login acadêmico nem pesquisa real. `.env.example` documenta a configuração.

Validação: `npm run check`, `npm run test:e2e` e `npm audit --audit-level=high`.
O build prepara o runtime standalone e seus assets; `npm start` executa o build.
O diagnóstico `npm run spec-compliance` permanece FAIL enquanto baseline,
contratos e aceite das integrações estiverem pendentes. Não alterar a baseline
para transformar o mock em uma integração aprovada.
