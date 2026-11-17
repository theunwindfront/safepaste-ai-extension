# Releasing SafePaste

SafePaste is published in two free places:

1. **GitHub Releases** for Chrome, Brave, Opera and other Chromium browsers (installed with Load unpacked).
2. **Microsoft Edge Add-ons** for Edge (one-click install, automatic updates).

Listing text, permission reasons and privacy answers are in [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md). Edge uses the same text.

## Before every release

1. Raise `version` in `src/manifest.json` and `package.json` (for example `0.1.0` → `0.1.1`).
2. Build and test: `npm run build`, reload `dist/` in the browser, and paste once on ChatGPT, Claude and Gemini.
3. Commit and push.

## 1. GitHub release

```bash
npm run release
```

This writes `safepaste-<version>-unpacked.zip`. It keeps the manifest `key`, so everyone who installs it gets the same extension ID (`cmchlgankkfhjljpahkjfmggibpankeh`).

On GitHub:

1. Open the repository, then **Releases → Draft a new release**.
2. **Tag:** `v<version>`, for example `v0.1.0`, on `main`.
3. **Title:** `SafePaste <version>`.
4. **Description:** what changed, plus the short install steps:

   > **Install (Chrome, Brave, Opera)**
   >
   > 1. Download `safepaste-<version>-unpacked.zip` below and unzip it somewhere permanent.
   > 2. Open `chrome://extensions` and turn on Developer mode.
   > 3. Click Load unpacked and pick the `safepaste-<version>` folder.
   > 4. Follow the setup page that opens (Ollama, then the model).
   >
   > Edge users: install from Microsoft Edge Add-ons instead.

5. Attach `safepaste-<version>-unpacked.zip` and click **Publish release**.

## 2. Microsoft Edge Add-ons

### One-time registration (free)

1. Go to [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview) and sign in with a Microsoft account.
2. Register for the **Microsoft Edge program** as an **Individual**. There's no fee.
3. Fill in your publisher display name, which is shown on the listing (for example `theunwindfront`), and a contact email.

### Each submission

```bash
npm run zip
```

This writes `safepaste-<version>.zip` without the manifest `key`, as stores require. Edge gives the extension its own ID; the setup page shows the matching `OLLAMA_ORIGINS` command.

In Partner Center, click **Create new extension** (or open SafePaste for an update), then:

**Packages:** upload `safepaste-<version>.zip`.

**Availability:**

- Visibility: Public
- Markets: all markets

**Properties:**

| Field                                                                 | Value                                                                                              |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Category                                                              | Productivity                                                                                       |
| Does your extension access, collect or transmit personal information? | Yes. It reads pasted text on three AI sites and sends it to a local AI on the user's own computer. |
| Privacy policy URL                                                    | `https://github.com/theunwindfront/safepaste/blob/main/PRIVACY.md`                                 |
| Website URL                                                           | `https://github.com/theunwindfront/safepaste`                                                      |
| Support contact                                                       | `https://github.com/theunwindfront/safepaste/issues`                                               |
| Mature content                                                        | No                                                                                                 |

**Store listings (English):**

| Field                             | Value                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Description                       | The full description from [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md). Edge needs at least 250 characters. |
| Short description                 | The summary from CHROMEWEBSTORE.md.                                                                   |
| Extension Store logo (300×300)    | `../assets/store/edge-logo-300x300.png`                                                               |
| Small promotional tile (440×280)  | `../assets/store/promo-small-440x280.png`                                                             |
| Large promotional tile (1400×560) | `../assets/store/promo-marquee-1400x560.png`                                                          |
| Screenshots (1280×800)            | The five `screenshot-*.png` files in `../assets/store/`                                               |
| Search terms (up to 7)            | `privacy`, `ChatGPT`, `Claude`, `Gemini`, `redact`, `Ollama`, `local AI`                              |

**Notes for certification:** paste the "Notes for the reviewer" section from CHROMEWEBSTORE.md.

Click **Publish**. Review usually takes up to 7 business days. After approval, put the listing link in the README's Microsoft Edge section, replacing "link coming soon".

### Updates

Upload the new ZIP under **Packages** in the existing submission and publish again. Edge updates installed copies automatically.

## Test in Edge before the first submission

Edge runs Chrome extensions as they are, but check once:

1. Open `edge://extensions`, turn on **Developer mode**, click **Load unpacked** and pick `dist/`.
2. Run the setup page's command for this ID, restart Ollama, and check the popup says **Local AI ready**.
3. Paste on ChatGPT and check the preview, the reply with real values, and copying.
