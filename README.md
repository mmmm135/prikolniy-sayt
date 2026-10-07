# POUDEV

Static studio landing page with scroll-driven WebGL scenes and project galleries.

## Development

Use Node.js 22.13 or newer (24 recommended).

```sh
npm ci
npm run dev
```

The development server listens on http://localhost:5173.

## Checks and build

```sh
npm run lint
npx tsc --noEmit
npm run build
npm audit --omit=dev
```

The static website is exported to `out/`. Host that directory with a static web server.

## Timeweb Cloud

Select Next.js in App Platform with SSR disabled. Build command: `npm run build`. Output directory: `out`. No application server, database, storage credentials, or environment secrets are required for the test landing page.

The contact form is a visual placeholder for this test release. No inquiry endpoint is deployed.

## Assets

Website assets are in `public/`. Third-party credits and licenses are documented in `public/ASSET-CREDITS.md` and `vendor/`.

Use `main` for deployment. Keep dependencies, generated output, and local runtime state out of version control.
