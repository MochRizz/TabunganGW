# Worklog

---
Task ID: 1
Agent: Main
Task: Fix transaction 401 bug - pemasukan tidak bertambah

Work Log:
- Identified root cause: `createMutation` and `deleteMutation` in page.tsx used raw `fetch()` instead of `apiFetch()` helper
- The `apiFetch` helper adds `X-User-Id` header from Zustand store, but raw fetch doesn't
- Fixed createMutation: `fetch('/api/transactions', ...)` → `apiFetch('/api/transactions', ...)`
- Fixed deleteMutation: `fetch('/api/transactions/${id}', {method:'DELETE'})` → `apiFetch('/api/transactions/${id}', {method:'DELETE'})`
- Also fixed: local DATABASE_URL was pointing to old SQLite file, reset local git to match GitHub

Stage Summary:
- Transaction creation now correctly sends X-User-Id header
- Verified on Vercel: POST /api/transactions returns 201
- Dashboard shows Rp 100.000 after adding income transaction

---
Task ID: 2
Agent: Main
Task: Add Strands animated background to auth screen and main app

Work Log:
- Installed `ogl` dependency (WebGL library)
- Created `/src/components/strands.tsx` - TypeScript conversion of React Bits Strands component
- Created `/src/components/strands.css` - Component styles
- Integrated Strands on auth-screen.tsx with dark theme + glassmorphism card
- Updated auth screen colors: dark bg (#0a0a1a), white text, glass card (bg-white/10 backdrop-blur-xl)
- Added subtle Strands background (30% opacity, 2 strands) to main app page.tsx
- Used `dynamic(() => import(...), { ssr: false })` for SSR safety

Stage Summary:
- Auth screen: dramatic dark theme with animated glowing strands + glassmorphism login card
- Main app: subtle translucent strands behind the light content area
- Both use indigo/cyan/purple color palette matching the app theme
- Deployed and verified on tabungangw.vercel.app