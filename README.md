# To-Do List App (React + TypeScript + Redux Toolkit + MUI + Framer Motion)

This repository is a local prototype for a modern To-Do list app.

Features
- Vite + React + TypeScript
- Redux Toolkit for state management (tasks + productivity settings)
- Material UI for UI components
- Framer Motion for animations
- LocalStorage persistence
- Firestore persistence via Firebase (anonymous auth)

Quick start

1. Install dependencies

```powershell
npm install
```

2. Run dev server

```powershell
npm run dev
```

Open http://localhost:5173 in your browser.

Notes
- This is a minimal prototype. Add more features (editing, filters, calendar view, backend sync) as needed.
 
Firebase
- This project now uses Firebase for authentication (anonymous) and Firestore for persisting tasks and productivity settings.
- Create a `.env` file with the following variables (or set them in your environment):

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

After setting the vars, run `npm install` and `npm run dev` as above.
