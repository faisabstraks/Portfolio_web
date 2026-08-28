# Faisabstrak — Personal Portfolio Website

A personal portfolio website for **Fahran Fa'is (Faisabstrak)** — a creative artist working in 3D art, visual storytelling, product animation, and 3D interior design. The site showcases project work across 3D art, film/editing, and Blender add-on development.

🔗 Live site: https://portfolio.faisabstrak.workers.dev/

## Features

- **Single-page hero + multi-page project layout** — a landing page (`index.html`) with an animated hero section, linking out to dedicated pages for each portfolio category.
- **Auto-updating "last updated" timestamps** — `script.js` calls the GitHub commits API to pull the real last-commit date for each page and displays it as a human-friendly relative time (e.g. "3 days ago at 14:20"), with `sessionStorage` caching to avoid excessive API calls.
- **Animated hero visuals** — CSS-driven rotating cube/sphere scene and a typed-text role animation.
- **Responsive navigation** — collapsible mobile menu via a checkbox-toggle pattern (no JS required for the menu itself).
- **Copy-to-clipboard contact info** and direct links to email, Instagram, and LinkedIn.

## Project Structure

```
.
├── index.html                  # Landing page — hero, about, project cards, contact
├── 3d-work-portfolios.html     # 3D art & animation portfolio page
├── editing-and-film.html       # Film & video editing portfolio page (in progress)
├── addon-dev.html              # Blender add-on / tools dev page (in progress)
├── styles.css                  # Global styles
├── script.js                   # Last-updated fetcher, hero animations, UI interactions
└── README.md
```

## Tech Stack

- Plain **HTML5 / CSS3 / vanilla JavaScript** — no build step, no frameworks or dependencies
- **Google Fonts** — Space Grotesk, Manrope, JetBrains Mono
- **GitHub REST API** (`api.github.com`) — used client-side to fetch each page's last commit date

## Getting Started

No build tools required — it's a static site.

1. Clone the repository:
   ```bash
   git clone https://github.com/faisabstraks/Portfolio_web.git
   cd Portfolio_web
   ```
2. Open `index.html` directly in your browser, or serve it locally:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8000
   ```
3. Visit `http://localhost:8000` (or the equivalent) in your browser.

## Configuration Notes

The "last updated" feature in `script.js` is hard-coded to a specific GitHub repo:

```js
var GH_OWNER = 'faisabstraks';
var GH_REPO = 'Portfolio_web';
var GH_BRANCH = 'main';
```

If you fork this project, update these values to point at your own repository, or the timestamps will reflect the original repo's commit history instead of yours.

## Deployment

As a static site, this project can be deployed on any static hosting provider, such as:

- GitHub Pages
- Netlify
- Vercel

For GitHub Pages: push to the `main` branch and enable Pages in the repository settings (source: `main` branch, root folder).

## Contact

- **Email:** fahranfais20@gmail.com
- **Instagram:** [@faisabstrak](https://www.instagram.com/faisabstrak/)
- **LinkedIn:** [Fahran Fa'is](https://www.linkedin.com/in/fahran-fa-is-0b9663214/)

## License

No license specified yet. Add a `LICENSE` file if you'd like to make the reuse terms explicit.
