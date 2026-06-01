# LexiOcean — Supabase Setup

## Phase 5C Database Setup

### Prerequisites
1. Create a project at https://supabase.com
2. Copy your project URL and anon key from: Project Settings → API
3. Add to `d:/ai-studio/ocean-english/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Run SQL Schema
1. Go to your Supabase dashboard → SQL Editor → New Query
2. Copy the contents of `sql/phase-5c-core-learning.sql`
3. Paste and click Run
4. Verify: Go to Table Editor — you should see all 9 tables created

### Authentication Setup
1. Go to Authentication → Providers → Email
2. Ensure "Enable Email Provider" is ON
3. Go to Authentication → URL Configuration
4. Set Site URL: `http://localhost:3000` (or your production URL)
5. Add Redirect URL: `http://localhost:3000/auth/callback`

### Tables Created
- `profiles` — extends auth.users, auto-created on signup
- `user_learning_preferences` — userLevel, daily goal
- `user_study_progress` — XP, streaks, totalWordsLearned
- `saved_words` — saved word IDs
- `review_words` — SM-2 spaced repetition state
- `word_review_events` — SM-2 audit log (optional)
- `wrong_answers` — incorrect quiz/scan answers
- `quiz_sessions` — completed quiz sessions
- `quiz_attempts` — individual question attempts
- `user_usage_limits` — rate limiting per user (future use)

### Row-Level Security
All tables have RLS enabled. Users can only access their own data.
The `profiles` table auto-creates a row when a new user signs up.

### Future: Generated Types
When ready, replace `types/database.ts` with Supabase CLI generated types:
```bash
npx supabase gen types typescript --project-id <your-project-id> > types/database.ts
```
