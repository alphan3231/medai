# MedAI

MedAI is a bilingual medical symptom-intake chatbot built with Next.js, Firebase, Firestore, and the OpenAI Responses API.

It is designed for structured symptom intake, not diagnosis. The app supports English and Turkish, stores chat history per user, streams assistant replies live, shows guided follow-up options, and highlights soft emergency warnings for red-flag symptoms.

## Highlights

- Next.js 16 App Router + TypeScript
- Firebase Auth with email/password
- Firestore-backed chat sessions and message history
- OpenAI Responses API with `gpt-5-nano-2025-08-07`
- Live streaming assistant replies over SSE
- Guided follow-up chips during the stream
- English / Turkish manual language toggle
- Soft emergency warning layer for risky symptom patterns
- Firebase App Hosting deployment

## Product behavior

- The assistant is an intake helper, not a doctor.
- Replies are streamed live into the chat UI.
- Each conversation keeps its own history and language.
- Follow-up options appear as clickable chips when the assistant can infer them.
- Chat opens at the latest message by default, and older messages remain scrollable upward.
- By default, accounts are rate-limited to `5` user messages per hour.
- `alphanozcan@gmail.com` is currently exempt from the hourly message quota.

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Firebase Web SDK
- Firebase Admin SDK
- Firestore
- OpenAI Node SDK
- Zod

## Project structure

- `app/` : App Router pages and API routes
- `components/` : chat UI, auth UI, shared interface pieces
- `lib/` : Firebase helpers, OpenAI integration, i18n, chat storage, follow-up parsing
- `firestore.rules` : Firestore access rules
- `firestore.indexes.json` : Firestore indexes
- `apphosting.yaml` : Firebase App Hosting configuration

## Requirements

- Node.js `20+`
- npm
- Firebase project with:
  - Authentication enabled for Email/Password
  - Firestore enabled
  - Firebase App Hosting enabled
- OpenAI API key

## Local development

1. Install dependencies

```bash
npm install
```

2. Create a local environment file

```bash
cp .env.example .env.local
```

3. Fill `.env.local`

Client Firebase config:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Server secret:

- `OPENAI_API_KEY`

Optional local Admin SDK values if application default credentials are not available:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```

## Firebase setup

1. Create a Firebase project.
2. Enable Email/Password in Firebase Authentication.
3. Create a Firestore database.
4. Deploy Firestore rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

5. Set the OpenAI key for App Hosting:

```bash
firebase apphosting:secrets:set OPENAI_API_KEY
```

6. Grant the backend access to the secret if needed:

```bash
firebase apphosting:secrets:grantaccess OPENAI_API_KEY
```

7. Create or connect an App Hosting backend.

The repository is already configured for Firebase App Hosting through `apphosting.yaml`.

## API

### `POST /api/chat`

Protected route for sending a user message and receiving a streamed assistant response.

Request body:

```json
{
  "chatId": "optional-existing-chat-id",
  "message": "I have had a headache since yesterday",
  "language": "en"
}
```

Behavior:

- requires Firebase ID token in `Authorization: Bearer <token>`
- enforces per-user quota unless exempt
- creates a new session when `chatId` is missing
- streams assistant events over `text/event-stream`
- persists finalized assistant output to Firestore

Stream events:

- `open`
- `heartbeat`
- `start`
- `delta`
- `follow_up`
- `done`
- `error`

### `GET /api/chats`

Returns the authenticated user’s chat session list for the sidebar.

### `GET /api/chats/:chatId`

Returns the authenticated user’s full message history for one conversation.

## Firestore data model

- `users/{uid}`
- `users/{uid}/rateLimits/chatMessages`
- `chats/{chatId}`
- `chats/{chatId}/messages/{messageId}`

Each chat stores:

- owner user id
- title
- summary
- language
- warning level
- last message preview
- timestamps

Each message stores:

- role
- content
- language
- warning level
- optional warning text
- timestamps

## Security notes

- `OPENAI_API_KEY` stays server-side only.
- Firestore rules restrict user data to its owner.
- Firebase public web config in `apphosting.yaml` is not a secret.
- If an API key is ever pasted into chat, logs, or screenshots, rotate it immediately.

## Current deployment

App Hosting URL:

- [https://medai--medai-20260520.us-central1.hosted.app](https://medai--medai-20260520.us-central1.hosted.app)

## Notes

- This project is intentionally optimized for App Hosting, not static-only Firebase Hosting.
- The medical warning layer is intentionally soft and non-diagnostic.
- If you want to change quota behavior, check the server-side logic in `lib/chat-store.ts`.
