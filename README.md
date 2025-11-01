# Periodic Table Quiz

Small browser quiz: Symbol ⇄ Atomic Number

This is a lightweight, configurable periodic-table quiz you can run locally. Pick a mode, choose how many questions, and practice matching element symbols with atomic numbers.

Files

- `index.html` — UI and page markup.
- `style.css` — Minimal styling.
- `data.js` — Configuration: edit the `elements` array and `countOptions` here.
- `script.js` — Main app logic (reads `window.CONFIG` from `data.js`).

Quick start

1. Open `index.html` in your browser (no build step required).
2. Choose a Mode and Questions count, then click **Start Quiz**.

Configuration (how to customize)

- Add/remove elements: edit `data.js` -> `elements` (objects with `{ num, symbol }`). Keep the array ordered how you want the "first N" behaviour to work.
- Change question counts shown in the dropdown: edit `data.js` -> `countOptions`. Use numbers or the string `'all'` to include an "All" option.
- Default behaviour: the app uses the first N elements from the `elements` array. If you want random sampling across the whole set, you can change the logic in `script.js` (easy to add a toggle).

Notes

- The finish screen shows questions grouped by element and sorted by the longest time taken. Any element with a wrong attempt (including skips) is marked with a ❌.
- `data.js` is the single place to update when you want to include more elements or different dropdown options.

Enjoy practicing! 👩‍🔬🧪
