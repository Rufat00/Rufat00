# Personal portfolio

A single-screen Astro portfolio with SCSS and locally hosted Manrope, plus an interactive business card.

## Run

Requires Node 22.12+ and pnpm.

```sh
pnpm install
pnpm dev
```

`pnpm build` creates the production site in `dist/`; `pnpm preview` serves it locally.

## Customize

Edit **src/config/portfolio.ts** for your name, initials, role, description, portrait, resume, social links, and theme colors. Social links and the resume start disabled until you enter real URLs. Email uses `mailto:you@example.com`. Put your resume in `public/resume.pdf` and set `resume.url` to `/resume.pdf`.

The theme values control the background, three ambient glows, and the button accent.

Use the `roles` list for the tags above your name, for example `roles: ['Computer Science Student', 'Your company', 'Your school']`. Each entry displays with an automatic `#` prefix. Tags wrap onto another row when needed; use an empty list to hide them.

- `src/components/`: header, hero, reusable social links, and SVG icons.
- `src/layouts/Layout.astro`: metadata, font, and global styles.
- `src/styles/global.scss`: resets and accessibility defaults.
- `src/styles/portfolio.scss`: responsive layouts and glass effects.
- `public/me.png`: your transparent portrait.

The mobile layout starts at 700px and uses an angled frosted panel with vertical social links. The page fits normal viewports; unusually short screens can scroll to keep content accessible. Substantially longer content may require adjusting the layout.

## Business card

Visit `/business-card/`, or use the mobile header link. Edit `src/config/business-card.ts` to change this page's name, role tags, banner, avatar, contacts, and accent independently of the portfolio. The images default to `public/banner.jpg` and `public/avatar.png`. `publicUrl` is optional; leaving it empty makes the QR code use the current page URL. Set it to your deployed HTTPS URL if you want a local preview's QR code to point to your live site.

On desktop, the QR code is always visible below the avatar. On mobile, pull down at the top of the card or drag its handle to reveal the QR view. Pull up at the top or press Escape to return. The handle also works as a keyboard-accessible toggle. **Share my card** opens native sharing when supported or copies the URL, with a selectable-link fallback. Contact links work without JavaScript; QR and sharing need JavaScript. Animations respect reduced-motion preferences. Short screens can scroll normally.
