# SafePaste

Hide private details before you paste into ChatGPT, Claude or Gemini.

SafePaste checks what you paste with a small AI model that runs **on your own computer** (through [Ollama](https://ollama.com)). It swaps names, companies, emails, phone numbers, keys, amounts and addresses for placeholders such as `PERSON_1`, so the AI site never sees the real values. When the AI replies, SafePaste shows the real values again on your screen.

```
You paste:      Hi Priya, Northwind Dental approved £14,500. Email marcus.feld@northwinddental.co.uk
The AI gets:    Hi PERSON_1, COMPANY_1 approved AMOUNT_1. Email EMAIL_1
You see:        the AI's reply with Priya, Northwind Dental, £14,500 and the email filled back in
```

## What stays private, and what doesn't

- The check runs locally. Your original text goes only to Ollama on `localhost`, never to us or any other server.
- The text with placeholders **does** go to the AI site. That's the point: the AI still sees your question, just not the private details in it.
- Nothing is caught perfectly. SafePaste shows a preview before pasting so you can hide or keep each item. Check it before you send anything sensitive.
- The list of placeholders and real values is kept in your browser's memory for that tab and deleted when you close the tab.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Features

- **Checks every paste** on chatgpt.com, claude.ai and gemini.google.com.
- **Preview before pasting:** click any highlighted item to keep it, or paste the original instead.
- **Real values in replies:** placeholders in the AI's answer are shown with the real values, underlined.
- **Copy gives real values:** select and copy, or use the site's copy button, and the clipboard gets the real text. Handy for drafting a client email or proposal with AI and pasting it straight into Gmail, Upwork or Fiverr.
- **Always hide and never hide lists** for words the AI gets wrong.
- **Works without the AI:** if Ollama is off, emails, phone numbers, keys, card numbers and similar patterns are still caught.
- **Per-site switch** in the toolbar popup.

## Requirements

- A recent version of Chrome, or another Chromium browser such as Edge or Brave.
- [Ollama](https://ollama.com/download) on macOS, Windows or Linux.
- About 2 GB of disk space for the default model (`qwen2.5:3b`) and 4 GB of free memory.

On a 4-core laptop CPU a paste takes about 8 seconds to check. A recent Mac or a computer with a graphics card is much faster.

## Setup

1. Install SafePaste (from the Chrome Web Store, or from source as below).
2. The setup page opens by itself. It walks you through three steps:
   1. **Install Ollama.**
   2. **Allow SafePaste to use Ollama.** Ollama only answers apps on its allowed list, so SafePaste shows the exact command for your system, with its own extension ID filled in. Run it, then restart Ollama.
   3. **Download the AI model.** One click; about 2 GB.
3. Open ChatGPT, Claude or Gemini and paste something.

You can reopen the setup page any time by clicking the status card in the toolbar popup.

## Build from source

```bash
git clone git@github.com:theunwindfront/safepaste.git
cd safepaste
npm install
npm run build
```

Then open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick the `dist` folder.

| Command          | What it does                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `npm run build`  | Builds `src/` into `dist/` (copies files, compiles Tailwind CSS, adds fonts and icons)              |
| `npm run watch`  | Rebuilds whenever a file in `src/` changes                                                          |
| `npm run zip`    | Builds, then writes `safepaste-<version>.zip` for the Chrome Web Store (without the manifest `key`) |
| `npm run format` | Formats the code with Prettier                                                                      |

The `key` in `src/manifest.json` keeps the unpacked extension ID fixed (`cmchlgankkfhjljpahkjfmggibpankeh`), so your `OLLAMA_ORIGINS` setting keeps working after a reload. The Chrome Web Store version has a different ID; the setup page always shows the right one.

## How it works

```
Paste on an AI site
  → content script stops the paste and sends the text to the service worker
  → service worker runs the regex patterns, then asks Ollama (JSON output, temperature 0)
  → preview shows what was found
  → text with placeholders is pasted into the chat box
  → a MutationObserver swaps placeholders in the reply for the real values, on screen only
```

| Folder                                          | Contents                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `src/background/`                               | Service worker, Ollama client, detection prompt and regex patterns, settings |
| `src/content/`                                  | Paste handling, placeholders, restoring replies, preview UI, clipboard       |
| `src/popup/`, `src/options/`, `src/onboarding/` | Toolbar popup, settings page, setup page                                     |
| `src/styles/`                                   | Tailwind CSS v4 theme and styles                                             |
| `scripts/build.mjs`                             | Build, watch and ZIP                                                         |

## Troubleshooting

| Message                    | Fix                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| "Ollama is not running"    | Start Ollama (open the app, or `ollama serve`).                                                                                |
| "Ollama blocked SafePaste" | `OLLAMA_ORIGINS` doesn't include this extension's ID. Rerun the command on the setup page and restart Ollama.                  |
| "AI model not downloaded"  | Download it on the setup page, or run `ollama pull qwen2.5:3b`.                                                                |
| Nothing happens on paste   | Check the site switch in the popup, then refresh the tab. Tabs opened before installing or reloading SafePaste need a refresh. |

## License

[MIT](LICENSE)
