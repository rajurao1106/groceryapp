# grocery_app

A grocery quick-commerce Flutter app prototype.

## Google Maps API key setup

This project includes `google_maps_flutter` for the location-confirmation flow. To run the map screen on Android and iOS, add your API key before testing on a device or emulator.

### Android

1. Create or open `android/local.properties`.
2. Add:
   `MAPS_API_KEY=your_android_api_key`
3. In `android/app/src/main/AndroidManifest.xml`, add:
   ```xml
   <meta-data
       android:name="com.google.android.geo.API_KEY"
       android:value="${MAPS_API_KEY}" />
   ```

### iOS

1. Open `ios/Runner/AppDelegate.swift`.
2. Add:
   ```swift
   GMSServices.provideAPIKey("your_ios_api_key")
   ```
3. Ensure the API key is also configured in the associated iOS project settings if needed.

## Getting Started

- `flutter pub get`
- `flutter run`
- `flutter analyze`

## Shared catalog backend (PostgreSQL + Fastify)

The admin Products page and Flutter home catalog now use the same PostgreSQL
catalog through the Fastify API. Product data is no longer read from or written
to admin-browser local storage. Admin changes are visible to the app after its
home catalog is refreshed; pull down on the home screen to refresh it.
Catalog and stock management are migrated in this pass. Demo orders, staff,
delivery partners, inventory movement history, and settings still use the
existing local-storage demo providers.

1. Install Node.js 20 or newer and PostgreSQL. In PostgreSQL, create the
   `grocery` database and a login role for the backend. For example, connect
   with `psql -U postgres` and run:
   ```sql
   CREATE ROLE grocery WITH LOGIN PASSWORD 'choose-a-password';
   CREATE DATABASE grocery OWNER grocery;
   ```
2. In `server`, copy `.env.example` to `.env` and replace the
   `DATABASE_URL`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` placeholders with
   your own values. Use a unique password with at least 12 characters.
   Run `npm install`. For a brand-new database run `npm run db:push`. If your
   existing database already has the catalog tables and `db:push` fails while
   altering an existing primary key, do not keep retrying it; run
   `npm run db:auth-schema` instead. This command only adds the admin auth
   tables and does not alter existing catalog data. Then run
   `npm run db:seed` and `npm run auth:seed-admin` before `npm run dev`.
   The admin password is stored as a scrypt hash, not plain text. Re-running
   `auth:seed-admin` updates the admin credentials from `.env`.
   Redis is optional and only used for product caching. To enable it, install
   and start Redis separately and set `REDIS_URL` in `server/.env`.
3. Configure Firebase Authentication and a Firebase Admin service account for
   customer payment endpoints. Set `FIREBASE_SERVICE_ACCOUNT_PATH` in
   `server/.env`. Do not expose service-account or Razorpay secrets to the
   browser or app. Product admin authentication uses the seeded database login,
   not Firebase.
4. In `client`, set `NEXT_PUBLIC_API_URL` if the backend is not running at
   `http://localhost:4000/api`, then run `npm install` and `npm run dev`.
   Open `http://localhost:3000/admin/login` and use the username and password
   configured in `server/.env`.
5. Run Flutter with an API URL appropriate to the device. Android emulator:
   `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api`.
   For a physical device, use the development computer's LAN IP; for iOS
   simulator, use `http://127.0.0.1:4000/api`.

The customer catalog route `GET /api/home` is public and returns published,
in-stock products. Admin catalog reads and product create/update/delete routes
require a valid database-backed admin session.
The backend includes Firebase-token-verified Razorpay order creation and
signature verification endpoints at `POST /api/payments/orders` and
`POST /api/payments/verify`. Order creation accepts
`{"items":[{"productId":1,"quantity":2}]}` and derives the amount from current
database prices and stock; it does not trust a client-submitted total.
Complete native checkout wiring requires the
Flutter sign-in flow to provide a real Firebase ID token; the current app OTP
repository is still a prototype and is not treated as a Firebase credential.

## Razorpay checkout integration

The existing Flutter checkout still uses a prototype native Razorpay flow. Do
not use it for real payments until the consumer login is connected to Firebase
and checkout calls the backend payment endpoints. The server-only credentials
belong in `backend/.env`, never in Flutter build arguments.

The API creates Razorpay orders server-side and verifies signatures plus captured
payment status. Flutter must send a Firebase ID token to use those endpoints.
