# Daily Primer

Anti-procrastination tool. A browser extension that shows your Obsidian daily note every time you open a new tab. If you try to open YouTube, Reddit, Twitter, or Instagram, it makes you stare at your plan first.

## What it does

- **New tab** shows today's daily note. First open of the day has a configurable timer.
- **Blacklisted sites** get intercepted. You see your note with a countdown. After that you can proceed.
- Reads your Obsidian vault directly. No cloud, no sync, no server.

## Setup

1. Clone this repo
2. Open `brave://extensions`, enable Developer mode, click "Load unpacked", pick the `extension/` folder
3. Run `./install.sh` from the project root (registers a helper that lets the extension read local files)
4. Restart your browser
5. Open the extension options, set your vault path and save

## Obsidian

The repo includes a daily note template and plugin configs. Copy them into your vault:

- `templates/daily-note-template.md` goes in your vault's `templates/` folder
- `.obsidian/daily-notes.json` and `.obsidian/templates.json` go in your vault's `.obsidian/` folder
- Create a `daily-notes/` folder in your vault root

Notes use `YYYY-MM-DD.md` naming. Open today's note in Obsidian with Cmd+P → "Daily notes: Open today's daily note".

## Config

All configurable from the extension options page:

- Vault path
- Daily notes subfolder and date format
- Timer durations (new tab and blocked sites)
- Blacklisted domains
