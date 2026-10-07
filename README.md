# POUDEV

Interactive studio website with scroll-driven WebGL scenes, project galleries, and an inquiry form.

## Requirements

- Node.js 22.13 or newer (Node.js 24 recommended)
- npm

## Development

```sh
npm ci
npm run dev
```

The development server listens on http://localhost:5173.

## Checks

```sh
npm run lint
npx tsc --noEmit
npm run build
npm audit --omit=dev
```

The production build is written to `.next/`. `npm start` starts the production server on port 3000 (or `PORT`) and listens on all network interfaces. A Dockerfile is also provided for Node.js 24.

## Inquiry storage

The `/api/inquiries` endpoint stores enquiries in PostgreSQL. Set `DATABASE_URL` in the hosting environment. The application creates its inquiry table on the first submission. The database must live outside the application container so updates preserve enquiries.

For TLS connections, set `DATABASE_SSL=true` and provide the database certificate authority in `DATABASE_CA` when required. Set `APP_ORIGIN` to the public HTTPS origin to restrict browser submissions to the website. Secrets belong in hosting variables, never in the repository.

In Timeweb App Platform, select Next.js with SSR (or Dockerfile), build with `npm run build`, and start with `npm start`. The container listens on port 3000.

## Assets

Website assets are in `public/`. Third-party asset credits and licenses are documented in `public/ASSET-CREDITS.md` and `vendor/`.

## Repository

Use the `main` branch for releases. Keep environment secrets, dependency directories, generated build output, and local runtime state out of version control.
