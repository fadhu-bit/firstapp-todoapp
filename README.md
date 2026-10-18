# To Do

A simple, animated to-do list app built with plain HTML, CSS and JavaScript. It has no frameworks and no build step.

## Features

- **Add, complete, edit and delete tasks.** Double-click a task to edit it.
- **Filters:** All / Active / Completed, plus **Clear completed**.
- **Progress bar** and an "items left" counter.
- **Saved automatically** in your browser with `localStorage`, so tasks survive a page refresh.
- **Light and dark mode**, following your system setting.
- **Works on phones** and other small screens.

### Animations

- **Adding a task:** the task springs into the list, the text appears letter by letter, a band of light sweeps across it, and confetti bursts from the add button.
- **Completing a task:** the checkmark draws itself in, a line strikes through the text, the row flashes green, confetti bursts out and a word like "Nice!" floats up.
- **Finishing every task:** a celebration banner drops in and confetti falls across the screen.
- **Deleting and clearing tasks:** tasks fly off the side and the list closes the gap.
- **Reduced motion:** if your system is set to reduce motion, the animations are switched off.

## Getting started

```bash
git clone https://github.com/fadhu-bit/firstapp-todoapp.git
cd firstapp-todoapp
open index.html   # macOS. On other systems, open index.html in any browser.
```

## Project structure

```
├── index.html   # Page layout
├── styles.css   # Styling, theming and CSS animations
└── app.js       # Task logic, storage, rendering and JS-driven effects
```

## How it works

Each task is stored as `{ id, text, done, createdAt }` in an array that is saved to `localStorage` after every change. The list is updated item by item rather than redrawn as a whole, so each task can animate in and out on its own. The effects use CSS keyframes and the Web Animations API.

## License

This project is licensed under the [MIT License](LICENSE).
