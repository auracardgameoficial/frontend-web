# Aura Cardgame Frontend (React + Vite)

Frontend para consumir eventos Socket.IO do backend com fluxo completo de partida.

## Módulos implementados

- Login
- Lobby / Matchmaking
- Coleção + Deck Builder
- Partida
- Resultado

## Estado atual da implementação

Hoje o projeto roda em **modo local (funcionando de ponta a ponta)** para autenticação e decks:

- `src/services/firebaseAuth.ts`: implementação local com `localStorage` para sessão, usuários e token mock (`local-token-*`).
- `src/services/firestoreData.ts`: implementação local com `localStorage` para catálogo e baralhos por usuário.

Ou seja, os nomes dos serviços seguem a interface de Firebase/Auth + Firestore, mas a persistência atual está local.

## Modos de funcionamento

### 1) Modo atual (ativo): localStorage

- Autenticação local (e-mail/senha e anônimo) via `localStorage`.
- Catálogo e decks salvos localmente por usuário.
- Não depende de projeto Firebase configurado para funcionar.

### 2) Modo alvo (roadmap): Firebase real

- Firebase Auth real (e-mail/senha e anônimo com token real).
- Firestore real para `cartas_mestras` e `usuarios/{userId}/baralhos/{deckId}`.
- Esta integração continua como **roadmap/integração futura** neste momento.

## Camadas principais

- `src/services/socketClient.ts`: encapsula conexão, assinatura de eventos e comandos de jogo.
- `src/services/firebaseAuth.ts`: camada de autenticação (atualmente com persistência local).
- `src/services/firestoreData.ts`: camada de dados de catálogo/decks (atualmente com persistência local).
- `src/features/partida`: componentes de mão/campo/carta com base para habilidades especiais.

## Eventos sincronizados na UI

- `partida_encontrada`
- `estado_atualizado`
- `fim_de_jogo`
- `erro_partida`
- reconexão (`disconnect`, `reconnect_attempt`, `reconnect`, `reconnect_failed`)

## Firebase (roadmap / integração futura)

Quando a integração real for ativada no código, usar:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

## Configuração de ambiente

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

2. Ajuste os valores em `.env.local` conforme seu ambiente.

### Chaves disponíveis

| Chave | Obrigatória hoje? | Fallback/comportamento sem valor | Status |
| --- | --- | --- | --- |
| `VITE_API_URL` | Não | Usa `http://localhost:3000` quando ausente ou vazia. | **Ativa** |
| `VITE_ENABLE_MOCK_MODE` | Não | Assume `false` quando ausente/inválida; só funciona em `DEV`. | **Ativa** |
| `VITE_FIREBASE_API_KEY` | Não | Permanece `undefined` quando ausente. | **Planejada (roadmap)** |
| `VITE_FIREBASE_AUTH_DOMAIN` | Não | Permanece `undefined` quando ausente. | **Planejada (roadmap)** |
| `VITE_FIREBASE_PROJECT_ID` | Não | Permanece `undefined` quando ausente. | **Planejada (roadmap)** |
| `VITE_FIREBASE_APP_ID` | Não | Permanece `undefined` quando ausente. | **Planejada (roadmap)** |

> Observação: as variáveis `VITE_FIREBASE_*` já estão previstas para a integração futura, mas o fluxo atual segue usando persistência local para auth/decks.

## Modo mock server

O mock só pode ser habilitado em desenvolvimento e quando a flag explícita estiver ativa:

```bash
VITE_ENABLE_MOCK_MODE=true
```

## Executar

```bash
cd frontend
npm install
npm run dev
```

Para backend online:

```bash
VITE_API_URL=http://localhost:3000 npm run dev
```


## Scripts disponíveis

- `npm run dev`: inicia o app em modo de desenvolvimento.
- `npm run build`: gera o build de produção com Vite.
- `npm run preview`: sobe o preview do build localmente.
- `npm run typecheck`: valida os tipos TypeScript sem gerar artefatos (`tsc --noEmit`).
- `npm run lint`: roda ESLint em todo o projeto.
- `npm run lint:fix`: aplica correções automáticas de ESLint e formatação com Prettier.
- `npm run test`: executa os testes com Vitest em modo não interativo.
- `npm run test:watch`: executa os testes com Vitest em watch mode.

## Deck builder e coleção

- Catálogo carregado de `cartas_mestras`.
- Baralhos em `usuarios/{userId}/baralhos/{deckId}` com campo `cartas`.
- Validação local: exatamente 30 cartas e no máximo 3 cópias por ID.
- Lobby exibe seletor de baralhos salvos (sem input livre de `deckId`).
