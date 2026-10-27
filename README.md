# Airbnb Stay Booking App

This full-stack lodging app is inspired by Airbnb. Guests can search stays, read reviews, and save wishlists. Hosts can create listings with photos, amenities, and a Mapbox pin.

Built with **Node.js 22+**, **Express 5**, **MongoDB / Mongoose**, **Passport local**, **Cloudinary**, **Mapbox**, EJS, and Bootstrap 5. There is no frontend build step.

## Features

- Search, category filters, and price filters
- Listing detail page with photo viewer, calendar, reviews, and nearby stays
- Auth (sign up, log in, POST log out) with rate limits
- Host tools: create / edit / delete listings (owner only)
- Reviews: one per user, not on your own listing
- Wishlists and a simple booking / trips flow
- Mapbox maps and geocoding
- Cloudinary image uploads (JPG / PNG / WEBP, 5 MB)

## Scripts

```bash
npm install
npm start          # node app.js (PORT or 8080)
npm run dev        # node --watch app.js
npm test           # node --test
node init/index.js # seed sample listings
```

## Environment

Copy `.env.example` to `.env` (never commit `.env`):

```
ATLASDB_URL=
SECRET=
MAP_TOKEN=
CLOUD_NAME=
CLOUD_API_KEY=
CLOUD_API_SECRET=
PORT=
OWNER_ID=
```

`ATLASDB_URL`, `SECRET`, and `MAP_TOKEN` are required at boot.

## Deploy with a private GitHub repository

The app runs on Render as a Node web service. The included `render.yaml` is a Render Blueprint; Netlify would require adapting the Express server to serverless Functions.

1. On GitHub, create a **private** repository. Do not include your `.env` file. The repository's `.gitignore` already excludes it.
2. From the project folder, initialize Git if needed, verify `.env` is ignored, then set the remote URL and push the default branch:

   ```sh
   git init
   git check-ignore .env
   git remote add origin https://github.com/YOUR_GITHUB_NAME/YOUR_PRIVATE_REPO.git
   git add .
   git status --short
   git commit -m "Prepare app for Render deployment"
   git branch -M main
   git push -u origin main
   ```

   If `git remote -v` already shows an `origin`, update it with `git remote set-url origin ...` rather than adding a second remote. GitHub may ask you to authenticate using its browser flow or Git Credential Manager; never put a password or token in the remote URL.

3. In Render, choose **New + > Blueprint**, connect GitHub, select the private repository, and deploy the Blueprint from `render.yaml`. Approve Render access to that private repository when prompted.
4. During the initial Blueprint setup, provide `ATLASDB_URL`, `MAP_TOKEN`, `CLOUD_NAME`, `CLOUD_API_KEY`, and `CLOUD_API_SECRET`. Render generates the `SECRET`. Do not add a `PORT`; Render configures the service to listen on its assigned port.
5. In MongoDB Atlas **Network Access**, allow the outbound IP addresses for the Render service, or use a static outbound IP option if available for your plan. Pick a Render region close to the Atlas cluster. Use Atlas's application connection string for `ATLASDB_URL`.
6. Wait for the Render deploy to become live, open its `onrender.com` URL, and check Render logs if startup fails. Add a custom domain later from the Render service settings.

The Blueprint uses Node 22, `npm ci`, `npm start`, and `/` as the health check. Pushes to `main` trigger automatic deploys. After the first Blueprint creation, add or rotate secrets in the Render service's **Environment** settings; Render's `sync: false` Blueprint values are only prompted on initial creation. Never commit `.env` or paste secret values into `render.yaml`.

To deploy updates, commit and push them to `main`; Render redeploys automatically. You can also deploy manually from the service's **Deploys** page.

## Folder structure

```
app.js
cloudConfig.js
controller/     listing, review, user, pages
models/         listing, review, user, booking
routes/
views/
public/         css, js, favicon, images
utils/
init/           seed data
tests/
```

## Demo content

Marked `<!-- demo content -->` in templates:

- Neighbourhood highlight copy and host “years hosting” / response rate
- Promo banner (“10% off”) and “Claim”
- Highlights under the title (outdoor entertainment, A/C, self check-in)
- Review category scores (same as the real overall average)
- Language / currency buttons (English IN, ₹ INR) — visual + toast
- Static help pages (`/help`, `/privacy`, `/terms`, …)

## Live demo

[instalodge-project.onrender.com](https://instalodge-project.onrender.com/listings)
