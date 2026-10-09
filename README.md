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

Deploy a fresh `npm run build` export from the latest `main`, including both HTML and `_next` assets. Clear any CDN HTML cache after replacing the export. A deployed root page must include `loading-butterfly-filmstrip` in its HTML; otherwise it is an older build without the original loading screen. First navigation plays the butterfly intro, while reload intentionally uses the short screen.

### Preparing the orchid

The source orchid has integer position attributes with a node scale. Dequantize it before optimization: processing its existing integer positions directly collapsed the flower's width and depth. Build checks compare the prepared flower's world bounds with the source on all three axes. The corrected model uses a new URL to avoid cached copies of the broken asset.

```sh
npx --yes @gltf-transform/cli@4.5.1 dequantize public/models/meadow/orchid/model.gltf work/orchid-float.glb
npx --yes @gltf-transform/cli@4.5.1 optimize work/orchid-float.glb public/models/meadow/orchid/orchid-print.glb --flatten false --instance false --join false --palette false --compress meshopt --simplify true --simplify-ratio 0.25 --simplify-error 0.0005 --texture-compress webp --texture-size 1024
node scripts/validate-orchid.mjs
```
