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
