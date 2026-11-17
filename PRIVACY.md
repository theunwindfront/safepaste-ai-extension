# SafePaste privacy policy

Last updated: 17 November 2026

SafePaste is a Chrome extension that hides private details in text you paste into ChatGPT, Claude or Gemini. This policy explains what it does with your data.

## The short version

- SafePaste has no server. We don't collect, receive, store or sell any of your data.
- The text you paste is checked by an AI model running on your own computer (Ollama), not in the cloud.
- The text **with placeholders** is pasted into the AI site you are using, and that site receives it as normal. Their privacy policy applies to what you send them.

## What SafePaste reads

When you paste into the chat box on chatgpt.com, claude.ai or gemini.google.com, SafePaste reads the pasted text to find private details. It also reads the AI's replies on those pages so it can show the real values in place of placeholders, and text you copy from those pages so it can put the real values in your clipboard.

SafePaste does nothing on any other website.

## Where your data goes

| Data                                                                                      | Where it goes                                                                                                         |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| The text you paste                                                                        | To Ollama on your own computer (`localhost` or `127.0.0.1`), to find private details. It doesn't leave your computer. |
| The text with placeholders                                                                | Into the chat box of the AI site, where you choose whether to send it.                                                |
| The list of placeholders and real values (for example `PERSON_1 = Priya`)                 | Kept in the browser's temporary session storage for that tab. It's deleted when you close the tab or the browser.     |
| Your settings (always hide and never hide lists, turned-off sites, model, Ollama address) | Kept in Chrome's local extension storage on your computer.                                                            |
| A daily count of pastes and hidden items                                                  | Kept in Chrome's local extension storage. Only the numbers are kept, not the text.                                    |

If you change the Ollama address in the settings to another computer, the text you paste goes to that computer instead. By default it is your own.

## What SafePaste does not do

- No analytics, tracking, ads or cookies.
- No accounts, and no data sent to the developer or any third party.
- No selling or sharing of data.
- No remote code: all of SafePaste's code is inside the extension.

## Limits

SafePaste can miss private details, or hide things that aren't private. It shows a preview before pasting so you can check. Don't rely on it as your only protection for highly sensitive information.

## Deleting your data

Close the tab to delete its placeholder list. To delete everything, remove the extension from `chrome://extensions`; Chrome then deletes all of its stored data.

## Changes

If this policy changes, the new version will be published here with a new date.

## Contact

Questions or concerns: open an issue at [github.com/theunwindfront/safepaste/issues](https://github.com/theunwindfront/safepaste/issues).
