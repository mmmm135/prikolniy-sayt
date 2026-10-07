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

The production build is written to `dist/`. `npm start` previews the Cloudflare Worker build locally; it does not publish the site.

## Inquiry storage

The `/api/inquiries` endpoint currently requires a Cloudflare D1 binding named `DB`. Database migrations are in `drizzle/`. The form returns an error when storage is unavailable.

Before deployment to Timeweb Cloud, adapt the server entry point and inquiry storage to the selected hosting environment. The existing local preview command is not a Timeweb production start command.

## Assets

Website assets are in `public/`. Third-party asset credits and licenses are documented in `public/ASSET-CREDITS.md` and `vendor/`.

## Repository

Use the `main` branch for releases. Keep environment secrets, dependency directories, generated build output, and local runtime state out of version control.
