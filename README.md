# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Deployment

This project is configured for automated deployment to **GitHub Pages** and supports **Netlify**.

### 1. GitHub Pages (Automated)
We use **GitHub Actions** to build and deploy the site automatically.

- **How it works**:
  1. Any push to the `main` branch triggers the [.github/workflows/deploy.yml](.github/workflows/deploy.yml) workflow.
  2. The workflow installs dependencies, builds the app, and deploys the `dist` folder to a branch named `gh-pages`.
  3. GitHub Pages serves the website from the `gh-pages` branch.

- **How to configure**:
  - Go to **Settings > Pages**.
  - Set **Source** to `Deploy from a branch`.
  - Content: **Source** = `Deploy from a branch`, **Branch** = `gh-pages`.

- **How to change**:
  - Edit `.github/workflows/deploy.yml` to change triggers or build steps.

### 2. Netlify (Supported)
This repository includes a `netlify.toml` file for easy Netlify deployment.

- **How to deploy**:
  - Connect this repository to your Netlify account.
  - Netlify will automatically detect the settings from `netlify.toml` (Build command: `npm run build`, Publish directory: `dist`).

The site will be live at `https://sarthakworks.github.io/alltools`.
