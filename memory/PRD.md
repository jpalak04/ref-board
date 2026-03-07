# RefBoard - Product Requirements Document

## Overview
RefBoard is a mobile + desktop app for teams to save and organize links, images, and notes with AI-powered categorization.

## Tech Stack
- **Frontend**: React Native Web (Expo 54)
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 2.0 Flash

## Core Features

### Authentication & RBAC
- [x] Name Picker + 4-digit PIN access control
- [x] Two roles: Founder and Team Member
- [x] Founders see all boards and content
- [x] Members see only assigned boards

### Boards
- [x] Board creation by Founders
- [x] Board-member assignment
- [x] References organized by board

### AI Features
- [x] AI Auto-fill: URL metadata extraction + Gemini categorization
- [x] Smart Tags: 3 searchable keywords per reference
- [x] Action Tagging: "Inspiration" or "To Execute" suggestions
- [ ] AI Similar Ideas: Panel showing 3 similar references (Backend ready, frontend wired)

### Screens
- [x] Login Screen (Name Picker + PIN)
- [x] Home Feed (Board view with search, filters)
- [x] Quick Save (Add new reference)
- [x] To Execute View (Action items)
- [x] This Week Digest (Weekly summary)
- [x] Team Settings (Founder-only management)
- [x] Reference Detail (Full view with tags)
- [x] Categories Management

### Deployment
- [x] GitHub Actions workflow for GitHub Pages (`deploy.yml`)
- [x] Web build configuration
- [x] Environment variable handling via secrets

## Database Schema

### Tables
- `team_members`: id, name, pin, role (founder/member)
- `boards`: id, name, founder_id
- `board_members`: board_id, member_id (join table)
- `categories`: id, name, color, subs
- `refs`: id, type, title, url, description, cat_id, subcat, author, board_id, action_tag
- `tags`: id, name
- `refs_tags`: ref_id, tag_id (join table)

## File Structure
```
/app
├── backend/
│   ├── server.py          # FastAPI with Gemini AI
│   └── requirements.txt
├── frontend/
│   ├── app/               # Expo Router screens
│   │   ├── (tabs)/        # Tab screens
│   │   ├── login.tsx
│   │   ├── team-setup.tsx
│   │   └── ref-detail.tsx
│   ├── src/
│   │   ├── context/       # AppContext (auth, data)
│   │   ├── lib/           # Supabase, API
│   │   └── components/
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Pages deployment
└── README.md
```

## Upcoming Tasks

### P0 (High Priority)
- [ ] Test full flow with real Founder account
- [ ] Verify AI tagging in production

### P1 (Medium Priority)
- [ ] Native Share Sheet integration (iOS/Android)
- [ ] Weekly Digest email/Telegram notifications
- [ ] Enhanced Similar Ideas with embeddings

### P2 (Future)
- [ ] Offline support
- [ ] Image upload from device
- [ ] Export/import functionality
