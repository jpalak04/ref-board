# RefBoard - Team Reference Library

A shared reference library for creative teams. Save links, reels, images and notes with AI-powered categorization.

## Features

- **Role-Based Access**: Founders see all boards, Team Members see assigned boards only
- **AI Auto-fill**: Automatic categorization, tagging, and action suggestions using Gemini AI
- **Smart Tags**: 3 searchable keywords auto-generated for each reference
- **Action Tagging**: Mark items as "Inspiration" or "To Execute"
- **Weekly Digest**: AI-generated summary of your team's saved references
- **Real-time Sync**: All changes sync instantly across the team via Supabase

## Tech Stack

- **Frontend**: React Native Web (Expo)
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 2.0 Flash

## Getting Started

### Prerequisites

1. A Supabase project with the required tables (see `frontend/database/migration.sql`)
2. A Gemini API key

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ref-board.git
cd ref-board

# Install frontend dependencies
cd frontend
yarn install

# Create .env file
cp .env.example .env
# Edit .env with your Supabase and Backend URLs

# Start the development server
yarn start
```

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Create .env file with your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env

# Run the server
python server.py
```

## Deployment to GitHub Pages

### Automatic Deployment

This repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the `main` or `app-v2` branch.

### Setup Instructions

1. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Source: "GitHub Actions"

2. **Add Repository Secrets** (Settings → Secrets and variables → Actions):
   - `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `EXPO_PUBLIC_BACKEND_URL` - Your deployed backend URL (or leave empty for static-only)

3. **Push to trigger deployment**:
   ```bash
   git push origin main
   ```

4. Your app will be available at: `https://YOUR_USERNAME.github.io/ref-board/`

### Manual Build

```bash
cd frontend
yarn build:web
# Output will be in the `dist` folder
```

## Database Schema

Run the migration SQL in your Supabase SQL Editor:

```sql
-- See frontend/database/migration.sql for full schema
-- Core tables: team_members, boards, board_members, categories, refs, tags, refs_tags
```

## Environment Variables

### Frontend (.env)
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

### Backend (.env)
```
GEMINI_API_KEY=your-gemini-api-key
```

## License

MIT
