# BRS Reminder App – PRD

## Overview
Mobile app (React Native Expo) for tracking client orders/installations with daily reminders.

## Auth
- Custom: User ID + Store Code lookup (no password hashing).
- Seeded users on backend startup: `BRS/1001`, `ADMIN/9999`.
- Session persisted with AsyncStorage.

## Screens
1. **Login** (`/`) – User ID + Store Code.
2. **Home** (`/home`) – Welcome card + 3 action cards: Past Entry, New Entry, Daily Reminder. Includes preview of upcoming reminders.
3. **Past Entry** (`/clients`) – Searchable list of clients (name / order # / details).
4. **Client Detail** (`/client/[id]`) – Full info, edit & delete.
5. **New / Edit Entry** (`/new-entry`) – Form: name, order #, installation date (YYYY-MM-DD), order details.
6. **Daily Reminder** (`/reminders`) – Clients with installation date in next 2 days.

## Backend (FastAPI + MongoDB)
- `POST /api/auth/login`
- `GET /api/clients?owner_user_id=&q=`
- `POST /api/clients`
- `GET /api/clients/reminders?owner_user_id=&days=2`
- `GET /api/clients/{id}`
- `PUT /api/clients/{id}`
- `DELETE /api/clients/{id}`

## Design
- Modern minimalist, deep blue (#0E3A60) primary on white, warm yellow (#FDB813) accent.
- Outfit (headings) + Plus Jakarta Sans (body) via Google Fonts.
- Big rounded cards (20px), generous spacing, lucide-react-native icons.
