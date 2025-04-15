# Rich Text Editor from Scratch

> A rich text editor React application, made from scratch with a custom command-based styling system.

## ✨ Features

- ⚡ Built with **React** and **Vite** for a blazing-fast dev experience
- 💅 Fully custom **styling command system** — think `applyToModel('STYLE_BOLD')`, like your own `execCommand`
- ✍️ Rich text editing via `contenteditable` — handled manually with DOM manipulation
- 🧠 Selection range preservation (no jumping cursors here!)

## Getting Started

Clone the repo and run it locally:

```bash
git clone https://github.com/your-username/rich-text-editor.git
cd rich-text-editor
npm install
npm run dev
```
> Make sure you have [Node.js](https://nodejs.org/) with [Vite](https://vite.dev/)

## Tech Stack
- **React** – UI components and state handling
- **Vite** – Lightweight dev server and build tool
- **Pure CSS** – Fully custom styling, no UI frameworks
- **DOM APIs** – Manual control over selections, ranges, and styling logic

## The Custom Command System
The heart of the editor is its custom styling command interface:

```js
applyToModel('STYLE_BOLD')
```

No ```document.execCommand``` hacks here — just a clean, controlled API for applying styles like bold, italic, underline, etc. It’s modular, extensible, and built to scale.

## Screeshots
![Demo Screenshoot](/public/screenshots/home_page.png)
![Demo Screenshoot](/public/screenshots/screenshoot2.png)

## License
MIT — feel free to use, tweak, or contribute.