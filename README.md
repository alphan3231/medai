# MedAI

MedAI is a bilingual medical symptom-intake chatbot built with Next.js, Firebase, and the OpenAI API. It uses the exact OpenAI model `gpt-5-nano-2025-08-07`, keeps the API key server-side, stores chat history in Firestore, and supports English and Turkish from a manual language toggle.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Firebase Auth (email/password)
- Firestore chat storage
- Firebase App Hosting deployment config
- OpenAI Responses API

## Features

- Symptom-intake chatbot with structured follow-up questions
- Soft emergency warning for red-flag symptoms
- English and Turkish UI and response support
- Email/password sign-up and sign-in
- Sidebar chat history
- Server-side protected chat routes
- Firestore security rules and indexes

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file and fill it:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Required environment variables

Client Firebase config:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Server secret:

- `OPENAI_API_KEY`

Optional local server-side admin credentials:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Firebase setup

1. Create a Firebase project.
2. Enable Authentication with Email/Password.
3. Create a Firestore database.
4. Deploy the Firestore rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

5. For App Hosting, store the OpenAI secret:

```bash
firebase apphosting:secrets:set OPENAI_API_KEY
```

6. Create an App Hosting backend and connect the GitHub repo:

```bash
firebase apphosting:backends:create --project YOUR_PROJECT_ID
```

## API routes

- `POST /api/chat`
- `GET /api/chats`
- `GET /api/chats/:chatId`

All routes require a Firebase ID token in the `Authorization: Bearer <token>` header.

## Notes

- The assistant is designed for intake and guidance, not diagnosis.
- In Firebase App Hosting, the Admin SDK can use application default credentials automatically.
- For local development, you may need the optional Firebase Admin environment variables if you are not using emulator credentials.
