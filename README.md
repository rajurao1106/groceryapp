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

## Razorpay test Key ID for Flutter

The Flutter app reads the public Razorpay test Key ID from the project-root
`.env` asset. Copy only `RAZORPAY_KEY_ID` from `server/.env` into that file as
`RAZORPAY_KEY=rzp_test_...`. Keep `RAZORPAY_KEY_SECRET` only in `server/.env`;
never put the secret in the Flutter app. Restart the app after changing `.env`.

The current Flutter payment repository is a mock and is not ready to complete
real payments. Do not ship the test key or treat this flow as production-ready.

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

## Deploy the backend to Vercel

Create a Vercel project with `server` as its Root Directory and deploy the
repository. Vercel uses `server/api/index.ts` as the Fastify serverless entry
point; `server/vercel.json` forwards API and health-check paths to it. Set the
install command to `npm install`, build command to `npm run build`, and leave
the output directory empty.

Add these environment variables to the Vercel project (Production and any
Preview environments that need the API):

- `DATABASE_URL`: a hosted PostgreSQL connection string. Prefer the database
  provider's pooled/serverless connection URL.
- `ADMIN_USERNAME` and `ADMIN_PASSWORD`: the admin account configuration.
- `CORS_ORIGINS`: comma-separated, exact browser origins for the deployed
  admin site and Flutter web app, such as `https://admin.example.com`.
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`:
  server-side Firebase Admin credentials. Store the private key as a Vercel
  secret; newline escapes (`\n`) are supported. Do not configure the local
  service-account file path on Vercel.
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` only if using the backend payment
  endpoints. Keep the secret server-side.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`
  for admin product image uploads. Keep the API secret server-side; the admin
  browser receives only a short-lived upload signature and public API key.
- `REDIS_URL` is optional; omit it to run without the product cache. Do not set
  it to `redis://localhost:6379` on Vercel; that address points inside the
  serverless instance, not to your development computer. Redis failures are
  logged and the catalog falls back to PostgreSQL.

After deployment, verify `/health` returns `{"status":"ok"}` and point the
Flutter app's `API_BASE_URL` build define to `https://<your-vercel-domain>/api`.
Run the database schema and admin seed commands against the hosted database
before using the deployed admin login.

### Cloudinary product images

Create a Cloudinary account and add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
and `CLOUDINARY_API_SECRET` to the server environment (local `server/.env` and
Vercel Environment Variables). Run `npm run db:push` from `server` to add the
`image_public_id` column before deploying this version. Admins can then select
JPG, PNG, or WebP product photos up to 5 MB in the product form. The browser
uploads directly to Cloudinary using a server-generated signature; product
URLs and public IDs are stored in PostgreSQL. Replacing, removing, or deleting
a product also removes its old Cloudinary image. If Cloudinary cleanup fails
after a catalog change, the API surfaces a warning so the orphan can be cleaned
up from the Cloudinary dashboard.
