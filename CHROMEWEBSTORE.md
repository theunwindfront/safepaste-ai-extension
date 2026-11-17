# Chrome Web Store listing

Everything to fill in on the [developer dashboard](https://chrome.google.com/webstore/devconsole). Upload `safepaste-<version>.zip` from `npm run zip`.

## Store listing

**Name:** SafePaste

**Summary** (132 characters max):

> Hide names, emails, keys and amounts before pasting into ChatGPT, Claude or Gemini. Checked by a local AI on your own computer.

**Category:** Tools
**Language:** English

**Description:**

> Pasting a client email, a contract or a log file into an AI chat sends every name, address and key in it to that company's servers. SafePaste hides those details first.
>
> When you paste into ChatGPT, Claude or Gemini, SafePaste checks the text with a small AI model that runs on your own computer through Ollama. It swaps private details for placeholders such as PERSON_1, COMPANY_1 or EMAIL_1, and the AI site only ever sees the placeholders. When the AI replies, SafePaste shows the real values again on your screen.
>
> WHAT IT HIDES
> • People and company names
> • Email addresses and phone numbers
> • API keys, passwords and tokens
> • Amounts, account and card numbers
> • Addresses, project names and private links
>
> HOW IT WORKS
> • Paste as usual. A preview shows what was found, and you can keep any item visible with one click.
> • The AI gets your question with placeholders instead of private details.
> • Real values appear in the reply on your screen, and copying the reply gives you the real text. Draft a client email or proposal with AI, then paste it straight into Gmail, Upwork or Fiverr.
> • Always hide and never hide lists for words that need a fixed rule.
> • If the local AI is off, common patterns like emails, phone numbers and keys are still caught.
>
> PRIVACY
> • The check runs on your computer. SafePaste has no server and collects no data.
> • The text with placeholders still goes to the AI site you use. That's how the AI can answer you.
> • No detection is perfect, so check the preview before sending something sensitive.
>
> NEEDS
> • Ollama (free, ollama.com) on macOS, Windows or Linux
> • About 2 GB of disk space for the AI model. The setup page walks you through it.
>
> Open source: github.com/theunwindfront/safepaste

## Graphics

From `../assets/store/` in the project folder:

| Slot                          | File                              |
| ----------------------------- | --------------------------------- |
| Store icon (128×128)          | `src/icons/icon-128.png`          |
| Screenshot 1                  | `screenshot-1-paste-preview.png`  |
| Screenshot 2                  | `screenshot-2-restored-reply.png` |
| Screenshot 3                  | `screenshot-3-onboarding.png`     |
| Screenshot 4                  | `screenshot-4-options.png`        |
| Screenshot 5                  | `screenshot-5-popup.png`          |
| Small promo tile (440×280)    | `promo-small-440x280.png`         |
| Marquee promo tile (1400×560) | `promo-marquee-1400x560.png`      |

The screenshots must match what the extension really looks like, so retake any that differ from the current build.

## Privacy practices

**Single purpose:**

> SafePaste hides private details in text pasted into AI chat sites (ChatGPT, Claude, Gemini) by replacing them with placeholders, then shows the real values again in the AI's reply on the user's screen.

**Permission justifications:**

| Permission                                                         | Justification                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                                          | Saves the user's settings (always hide and never hide lists, turned-off sites, model name), a daily count of hidden items shown in the popup, and the per-tab list of placeholders and real values in session storage so replies can be restored. |
| `activeTab`                                                        | Lets the toolbar popup read the current tab's address so it can show the on/off switch for that AI site.                                                                                                                                          |
| Host permission `http://localhost/*`                               | Sends pasted text to Ollama, the AI model running on the user's own computer, to find private details. Nothing is sent to a remote server.                                                                                                        |
| Host permission `http://127.0.0.1/*`                               | Same as `localhost`, for systems where Ollama is reached by IP address.                                                                                                                                                                           |
| Content scripts on `chatgpt.com`, `claude.ai`, `gemini.google.com` | Catch pastes into the chat box to hide private details, show the preview, show real values in the AI's replies and give real values when the user copies. They run only on these three sites.                                                     |

**Remote code:** No, I am not using remote code. All JavaScript is included in the package.

**Data usage.** SafePaste collects none of the listed data types. Pasted text is processed on the user's device by a local AI model and is never sent to the developer. Tick the three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:**

> https://github.com/theunwindfront/safepaste/blob/main/PRIVACY.md

## Distribution

- Visibility: Public (or Unlisted for a soft launch)
- Regions: All regions
- Price: Free

## Notes for the reviewer

Paste into the "Test instructions" field so the reviewer can see the extension working:

> SafePaste needs Ollama running on the same computer.
>
> 1. Install Ollama from https://ollama.com/download.
> 2. After installing SafePaste, the setup page opens. Run the command it shows for your system (this allows the extension's ID in OLLAMA_ORIGINS), restart Ollama, then click "Download model".
> 3. Open https://chatgpt.com and paste: "Hi Priya, Northwind Dental approved £14,500. Email marcus.feld@northwinddental.co.uk".
> 4. A preview shows the details found. Click "Paste protected" to paste the text with placeholders.
>    Without Ollama, the extension still hides emails, phone numbers and keys with built-in patterns, and the popup shows "Ollama is not running".

## Before each upload

1. Raise `version` in `src/manifest.json` and `package.json`.
2. `npm run zip`.
3. Load `dist/` unpacked and test a paste on all three sites.
4. Upload the ZIP and update any changed screenshots.
