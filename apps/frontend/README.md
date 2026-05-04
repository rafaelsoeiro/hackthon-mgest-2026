# Frontend

## Setup local

1. Copie `.env.example` para `.env`.
2. Garanta que `VITE_API_URL` aponta para o backend (`http://localhost:3000` por padrão).
3. Rode:
   - `npm install`
   - `npm run dev`

## Feature flags

- `VITE_FEATURE_JIRA_ENABLED=true` (padrão)
- `VITE_FEATURE_AI_ENABLED=false` (padrão local)
- `VITE_FEATURE_EVOLUTION_ENABLED=false` (padrão local)

Quando uma feature está desabilitada e algum endpoint dela é chamado, o frontend lança erro orientativo antes de enviar a requisição.
