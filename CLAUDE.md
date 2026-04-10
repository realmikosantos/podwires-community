# Podwires Community

Podcast industry community platform connecting producers with clients (brands/businesses).
Circle.so-style community with real-time messaging, deployed at community.podwires.com.

## Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Zustand, Socket.io-client
- **Backend**: Node.js, Express, PostgreSQL, Socket.io
- **Payments**: Stripe (subscriptions)
- **Auth**: JWT with refresh token rotation + WordPress SSO
- **Deployment**: Ubuntu 24.04 VPS, Nginx reverse proxy at community.podwires.com

## Project Structure
```
podwires-community/
├── client/                # Next.js 14 frontend (port 3000)
│   └── src/
│       ├── app/
│       │   ├── page.tsx             # Landing page
│       │   ├── layout.tsx           # Root layout
│       │   ├── auth/login/          # Login page
│       │   ├── auth/register/       # Register page
│       │   ├── dashboard/           # Dashboard (home after login)
│       │   ├── spaces/[slug]/       # Space feed with posts + comments
│       │   ├── deal-room/           # Deal Room project list
│       │   ├── deal-room/[id]/      # Deal Room chat (real-time)
│       │   ├── producers/           # Talent Hub — browse producers
│       │   ├── producers/[id]/      # Producer profile + hire modal
│       │   ├── jobs/                # Job board (from WP REST API)
│       │   ├── profile/edit/        # Edit own profile
│       │   └── settings/            # Subscription + notifications
│       ├── components/
│       │   └── AppShell.tsx         # Circle.so-style sidebar layout
│       ├── lib/
│       │   ├── api.ts               # REST API client with token refresh
│       │   ├── auth-store.ts        # Zustand auth state
│       │   └── socket.ts            # Socket.io client helper
│       ├── styles/globals.css       # Tailwind + custom components
│       └── types/index.ts           # TypeScript interfaces
├── server/                # Express API backend (port 5000)
│   └── src/
│       ├── index.js                 # HTTP + Socket.io server entry
│       ├── app.js                   # Express app config + routes
│       ├── config/
│       │   ├── database.js          # PostgreSQL pool
│       │   └── stripe.js            # Stripe + plan definitions
│       ├── middleware/
│       │   ├── auth.js              # JWT auth, optional auth, role/tier guards
│       │   └── validate.js          # express-validator middleware
│       ├── controllers/
│       │   └── authController.js    # Register, login, refresh, SSO, getMe
│       ├── routes/
│       │   ├── auth.js              # /api/auth/*
│       │   ├── users.js             # /api/users/* (profiles, producers)
│       │   ├── spaces.js            # /api/spaces/*
│       │   ├── posts.js             # /api/posts/* (CRUD, comments, likes)
│       │   ├── projects.js          # /api/projects/* (Deal Room)
│       │   ├── jobs.js              # /api/jobs (proxy to WP REST API)
│       │   ├── subscriptions.js     # /api/subscriptions/* (Stripe)
│       │   ├── notifications.js     # /api/notifications/*
│       │   └── webhooks.js          # /api/webhooks/stripe
│       ├── websocket/
│       │   └── socket.js            # Socket.io — Deal Room chat + typing
│       └── migrations/              # PostgreSQL schema (001–007)
└── nginx/
    └── community.podwires.com.conf  # Reverse proxy config
```

## Commands
- `npm run dev` — Start both client and server in development
- `npm run migrate` — Run database migrations
- `npm run migrate:rollback` — Rollback last migration
- `npm run build` — Build Next.js for production

## Key Design Decisions
- Subdomain `community.podwires.com` (not path-based) for isolation from WordPress
- Two user roles: `producer` and `client`, plus `admin`
- Three subscription tiers: `free`, `pro` ($29/mo), `vip` ($49/mo)
- Four spaces with tier/role-based access control
- Deal Room project status flow: Inquiry → Proposal → Active → Completed
- Real-time messaging in Deal Room via Socket.io
- Jobs pulled from Podwires.com WordPress REST API
- WordPress SSO for seamless login from podwires.com
- AppShell component provides Circle.so-style persistent sidebar navigation
