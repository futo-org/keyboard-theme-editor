# FUTO Keyboard Theme Editor

This is the repo containing code for the advanced theme editor. You can access the live theme editor at https://keyboard.futo.tech/theme-editor/

This is separate from the in-app theme editor which is recommended for typical users. The in-app editor's code is located within the keyboard repo.

## Architecture

This project uses custom JSX. The elements are constructed via `Ui.quickh` which basically just calls `document.createElement` but includes a few useful utilities. There is also id namespacing via `Ui.namespaced` to access elements by id.

There is a lot of global state use in this project. For example, the current theme is at `State.theme` and many components will make reference to it. In order to respond to changes, there is an event bus at `State.ev`.

The editor supports full undo and redo via `State.execute`, which takes forward and backward functions for modifying and reverting state. Any changes to the theme should go through this function to ensure the user can Ctrl+Z their change.

There is a core library at `core/` for external use (to load and render theme ZIPs) which the editor at `src/` uses.

## Development

After cloning the repo, run `npm install`. You can now execute `npm run dev` to start the development server.

To run the linter, run `npm run lint`. Some problems like wrong indentation are auto-fixable by running `npm run lint:fix`.

## Editing

The theming system is very heavily tied to FUTO Keyboard. If you at all touch `core/keyboard/render.ts` or the TOML exporting code in `src/windows/ExportWindow.jsx`, then changes will be necessary in the FUTO Keyboard app. Please consult by opening a proposal issue first.
