# Davo Five-O Challenge

A mobile-friendly family fitness tracker for the 50-day challenge running from
2 August to 20 September 2026.

## What is included

- Five participant profiles: Sam, Trish, Dave, Emma, and Jacob
- Daily 30+ minute session logging with activity type, minutes, and notes
- Optional private weight entry alongside any session
- A live family activity feed that never exposes an entered weight
- Automatic Sunday weight reveals, with in-progress weekly weights protected by database rules
- A private personal weight chart for each participant
- Cumulative weight-loss and exercise comparison charts
- Weight-loss and exercise leaderboards
- $50-per-kilogram reward tracking with the 4 kg eligibility minimum
- Responsive phone, tablet, and desktop layouts
- Supabase authentication, shared data, and row-level security setup
- A no-setup preview mode with sample data

## Run it locally

```bash
npm install
npm run dev
```

If the Supabase variables are not present, the app automatically opens in
preview mode. Preview changes last for the current browser session only.

## Connect the shared database

1. Create a Supabase project.
2. Run `supabase/schema.sql` in its SQL editor.
3. In **Authentication → Users**, create and auto-confirm these users with a
   password for each person:

   - `sam@davo-five-o.local`
   - `trish@davo-five-o.local`
   - `dave@davo-five-o.local`
   - `emma@davo-five-o.local`
   - `jacob@davo-five-o.local`

4. Run `supabase/seed_profiles.sql` in the SQL editor. This links the five Auth
   users to their challenge profiles. The app colours are:

| Profile | Slug | Colour |
| --- | --- | --- |
| Sam | `sam` | `#f2c94c` |
| Trish | `trish` | `#ef8354` |
| Dave | `dave` | `#3b82a0` |
| Emma | `emma` | `#8a6fd1` |
| Jacob | `jacob` | `#54a777` |

5. Copy `.env.example` to `.env.local` and add the Supabase URL and anon key.
6. Restart the development server.

Each person signs in by selecting their profile and entering the password you
gave their Supabase user. All signed-in family members can see session activity
as it happens. Row-level security ensures that weight entries can only be read
by their owner; the `released_weekly_results` view exposes a Sunday snapshot
only after that week has closed in the Pacific/Auckland timezone.

## Netlify

The included `netlify.toml` uses the standard Next.js build. Add
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Netlify
environment settings before deploying.

The repository does not deploy automatically until it is linked to a Netlify
site.
