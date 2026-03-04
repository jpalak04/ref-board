# RefBoard PRD

## Overview
RefBoard is a team reference library for saving links, reels, images and notes from Instagram and the web. Built with React Native Web / Expo for iOS, Android, and desktop browser from a single codebase.

## Architecture
- **Frontend**: React Native Web / Expo (expo-router, file-based routing)
- **Backend**: FastAPI (Python) — OG fetching, Gemini AI categorization
- **Database**: Supabase (PostgreSQL with Realtime subscriptions)
- **AI**: Google Gemini 2.0 Flash (via `google.genai`)
- **Fonts**: Syne 700 (headings), Manrope 400-700 (body)

## User Personas
- Creative agency team members (designers, marketers, strategists)
- Team lead who manages categories and members
- Remote team sharing visual references

## Core Requirements (Static)
1. Save URLs as references with auto-fetched title, description, thumbnail via OpenGraph
2. AI auto-categorization using Gemini from user's existing category list
3. Real-time board sync — all team members see updates live
4. Dark mode only, premium editorial design (#141414 background)
5. Magazine-style masonry grid layout

## Implemented Features (as of 2026-03-04)

### Home Feed Screen
- 2-column masonry grid of references
- Category filter chips (all 6 seeded categories with color-coded dots)
- Type filter bar (All, Reel, Image, Link, Note)
- Search by title/description
- Pull-to-refresh
- Long-press to delete reference
- Supabase Realtime subscription (live updates)
- Shows ref count

### Quick Save Screen
- URL input with clipboard paste button
- Auto-analyze: OG fetch → thumbnail + title + description
- Gemini AI auto-suggests category and sub-category (with ID/name fallback matching)
- Auto-detects content type (reel/image/link/note)
- Type pill selector
- Category modal picker (all categories with color dots and sub-category preview)
- Sub-category pill row (auto-populated from selected category)
- Author/team member chips (pre-set list from AsyncStorage)
- "AI suggested" badge when category is auto-filled
- Save button → Supabase insert → navigate to board
- Animated success state

### Categories Screen
- All 6 seeded categories with colored side bars
- Sub-category chips with category color
- Edit category (name, color from 8-color palette, add/remove sub-categories)
- Delete category (with confirmation)
- Add new category modal
- Real-time sync via Supabase subscription

### Team Settings Screen
- Pre-set team members list (starts with "Palak")
- Add new team member via modal
- Remove team members (can't remove last member)
- Selected member shown as "Currently saving as"
- Members stored in AsyncStorage (device-local)
- Share intent info section

### Backend API (FastAPI)
- `GET /api/health` — Returns status + gemini connectivity
- `POST /api/fetch-og` — Fetches OpenGraph meta tags (title, description, image, type)
- `POST /api/ai-autofill` — Gemini 2.0 Flash categorization with category ID/name + subcat + type

### Design System
- Colors: lime (#B5CC6A), coral (#E8846A), cream (#F5E6C8), lavender (#A89EC4)
- Category color name mapping (lime/coral/sky/peach/lavender/mint → hex)
- RefBoard logo: 4-tile grid mark (lime/coral/cream/lavender) + "RefBoard" wordmark
- Bottom tab: Board, Save (lime FAB), Categories, Team

### In-App Browser Preview Screen (added 2026-03-04)
- Tap any ref card → opens `/preview` screen as a modal
- Native: Full embedded WebView (react-native-webview) with custom header + URL bar + back/forward/reload controls
- Web: Shows URL preview with "Open in Browser" button (sites like Instagram block iframe embeds)
- Back arrow (←) returns to board
- External link icon (↗) opens in system browser
- Graceful error state when site blocks embedded preview
- App scheme: `refboard://`
- Android intent filters for `text/plain` SEND action
- Deep link handler ready for native share sheet (requires EAS build for full native share)
- URL param handling: `/add?url=...` opens Quick Save with pre-filled URL

## Database Schema (Supabase)
### categories
- id (text PK), name, color, subs (jsonb array), created_at

### refs
- id (text PK), type, title, url, description (JSON with {t, i}), cat_id, subcat, author, created_at

**Note**: description field stores JSON `{t: "text", i: "imageUrl"}` to persist thumbnails without schema changes.

## Prioritized Backlog

### P0 (Critical - Next Sprint)
- [ ] GitHub Pages deployment setup (jpalak04/ref-board)
- [ ] EAS build configuration for native share sheet
- [ ] iOS share extension setup

### P1 (Important)
- [ ] Native share sheet on iOS (Share Extension, requires EAS)
- [ ] Open Graph image proxy for CORS-blocked images
- [ ] URL preview card on home feed (open in-app browser or external)
- [ ] Bulk delete / multi-select

### P2 (Nice to have)
- [ ] Drag to reorder references
- [ ] Notes/text editor for "note" type refs
- [ ] Export board as PDF/image
- [ ] Search by author
- [ ] Dark/light mode toggle (stretch goal)
- [ ] Copy link button on cards
- [ ] Tag/label system
