<div align="center">

# AnjurXdating — Dating App

**A full-stack dating web app** with real swipe-to-match, mutual matching, and live chat — built with React 18 and Firebase.

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-2-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-9-ffca28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-gestures-ff4d8d?logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**[🌐 Live Demo](https://spark.giovanni-moreno.com)** · Built by [Giovanni Moreno](https://giovanni-moreno.com)

</div>

---

## Overview

**AnjurXdating** is a fully functional dating app — not a static demo. Registration, swipes, matches, and chat are persisted in the cloud (Cloud Firestore), and real users appear in each other's discovery deck. It's built with **React 18**, **Vite**, **Tailwind CSS**, **Zustand**, **Framer Motion**, and **Firebase** (Authentication + Firestore).

To keep the experience lively while the user base grows, AnjurXdating seeds a few **bot profiles** that match instantly and reply in chat.

> ⚠️ This is an independent portfolio project inspired by swipe-based dating apps. It is **not affiliated with, endorsed by, or connected to** Tinder or Match Group.

> Keywords: React, Firebase, Firestore, dating app, swipe, real-time chat, Zustand, Framer Motion, Tailwind CSS, full-stack web app.

## ✨ Features

| | Feature |
|---|---|
| 🔐 | **Authentication** — email/password and Google sign-in (with popup → redirect fallback for mobile) |
| 📝 | **Onboarding** — create your profile (name, age, job, bio, photo) |
| 🃏 | **Swipe deck** — drag-to-swipe cards with LIKE / NOPE stamps and tap-to-cycle photos |
| 💞 | **Real mutual matching** — a match happens only when two users like each other |
| 🤖 | **Seed bots** — always-available profiles that match instantly and reply in chat |
| 💬 | **Real-time chat** — live messages via Firestore `onSnapshot` with last-message preview |
| 📋 | **Matches list** — sorted by most recent activity |
| 👤 | **Profile** — view your own profile and log out |

## 🧱 Tech Stack

**Frontend:** React 18 · Vite · React Router 6 · Tailwind CSS · Zustand · Framer Motion · lucide-react

**Backend (Firebase):** Firebase Authentication · Cloud Firestore (real-time) · Firebase Hosting

## 🏗️ Architecture

```mermaid
flowchart LR
    U[User] --> SPA["React SPA (Vite)"]

    subgraph Client
        SPA --> RP[ProtectedRoute<br/>auth + profile guard]
        SPA --> AZ["authStore (Zustand)"]
        SPA --> DZ["deckStore (Zustand)"]
        SPA --> DAL["lib/firestore.js<br/>profiles · swipes · matches · chat"]
    end

    DAL -->|Auth| FA[Firebase Authentication]
    DAL -->|real-time| FS[(Cloud Firestore)]
    BOTS["data/bots.js<br/>seed profiles"] --> DZ
```

### Matching Flow

```mermaid
sequenceDiagram
    participant A as User A
    participant FS as Firestore
    participant B as User B

    A->>FS: like(B)  (tinder_swipes/A/likes/B)
    FS-->>A: check reverse like (B -> A?)
    alt Mutual like
        FS->>FS: create match (matchId = sorted uids)
        FS-->>A: It's a match! 🎉
        FS-->>B: It's a match! 🎉
    else No reverse like yet
        FS-->>A: keep swiping
    end
```

### Data Model (Firestore)

```
tinder_profiles/{uid}                          -> public profile (readable by authenticated users)
tinder_swipes/{uid}/likes/{targetUid}          -> likes/nopes (private per user)
tinder_matches/{matchId}                       -> a match between two users (matchId = sorted uids)
tinder_matches/{matchId}/messages/{msgId}      -> chat messages
```

Security rules restrict each document to its owner or to the participants of the match. They live in a central `firebase-firestore-rules` repository (the Firestore base is shared across portfolio projects with a single ruleset), not in this repo.

## 📂 Project Structure

```
src/
  lib/         firebase.js (init) and firestore.js (profiles, swipes, matches, chat)
  store/       authStore.js, deckStore.js
  data/        bots.js (seed profiles and replies)
  components/  SwipeCard, ActionButtons, MatchModal, ChatBubble, TopNav, ...
  pages/       Login, Onboarding, Discover, Matches, Chat, Profile
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Firebase project with Authentication (Email/Password + Google) and Cloud Firestore enabled

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Gemu03/spark-dating-app.git
   cd spark-dating-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your Firebase web SDK keys (`VITE_FIREBASE_*`):
   ```bash
   cp .env.example .env
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

### Scripts

| Command           | Description                       |
|-------------------|-----------------------------------|
| `npm run dev`     | Start the Vite dev server         |
| `npm run build`   | Build for production to `dist/`   |
| `npm run preview` | Preview the production build      |

## 📸 Screenshots

<p align="center">
  <img src="docs/screenshot.webp" alt="AnjurXdating app — swipe deck" width="420" />
</p>

<p align="center"><i>Swipe-to-match deck. Try the live app at <a href="https://spark.giovanni-moreno.com">spark.giovanni-moreno.com</a>.</i></p>

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
