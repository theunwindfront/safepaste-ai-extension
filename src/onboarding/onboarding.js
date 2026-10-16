import { $, h, loadSettings } from '../shared/pages.js';

const ORIGIN = `chrome-extension://${chrome.runtime.id}`;

const COMMANDS = {
    macOS: `launchctl setenv OLLAMA_ORIGINS "${ORIGIN}"\n# Then quit Ollama from the menu bar and open it again.`,
    Windows: `setx OLLAMA_ORIGINS "${ORIGIN}"\n# Then quit Ollama from the system tray and open it again.`,
    Linux: [
        'sudo mkdir -p /etc/systemd/system/ollama.service.d',
        `printf '[Service]\\nEnvironment="OLLAMA_ORIGINS=${ORIGIN}"\\n' | sudo tee /etc/systemd/system/ollama.service.d/safepaste.conf`,
        'sudo systemctl daemon-reload && sudo systemctl restart ollama',
    ].join('\n'),
};

const STEPS = ['#step-install', '#step-allow', '#step-model'];
const REACHED = { offline: 0, error: 0, blocked: 1, 'no-model': 2, ready: 3 };
const STATUS_TEXT = {
    offline: 'Waiting for Ollama to start…',
    blocked: 'Ollama is running but blocks SafePaste. Run the command above, then restart Ollama.',
    'no-model': 'Ollama is ready. Download the model to finish.',
    ready: '',
};

const settings = await loadSettings();
$('#model-name').textContent = settings.model;

const platform = (navigator.userAgentData?.platform ?? navigator.platform).toLowerCase();
let os = platform.includes('mac') ? 'macOS' : platform.includes('win') ? 'Windows' : 'Linux';

function renderCommand() {
    $('#os-tabs').replaceChildren(
        ...Object.keys(COMMANDS).map((name) => {
            const tab = h('button', '', name);
            tab.setAttribute('aria-pressed', String(name === os));
            tab.addEventListener('click', () => {
                os = name;
                renderCommand();
            });
            return tab;
        }),
    );
    $('#command').textContent = COMMANDS[os];
}

$('#copy').addEventListener('click', async () => {
    await navigator.clipboard.writeText(COMMANDS[os].replace(/\n#.*$/m, ''));
    $('#copy').textContent = 'Copied';
    setTimeout(() => ($('#copy').textContent = 'Copy command'), 1500);
});

let timer = null;

async function check() {
    clearTimeout(timer);
    const status = await chrome.runtime.sendMessage({ type: 'status' });
    const reached = REACHED[status.state] ?? 0;
    if (reached === 3) chrome.storage.local.set({ setupDone: true });
    STEPS.forEach((selector, i) => {
        $(selector).dataset.state = i < reached ? 'done' : i === reached ? 'current' : 'todo';
    });
    $('#ready').hidden = reached < 3;
    $('#status').textContent = STATUS_TEXT[status.state] ?? status.error;
    if (reached < 3) timer = setTimeout(check, 4000);
}

const gb = (bytes) => `${((bytes ?? 0) / 1e9).toFixed(2)} GB`;

function setProgress(fraction, text) {
    if (fraction !== null) $('#progress i').style.width = `${Math.round(fraction * 100)}%`;
    $('#progress span').textContent = text;
}

$('#download').addEventListener('click', () => {
    $('#download').disabled = true;
    $('#progress').hidden = false;
    setProgress(0, 'Starting…');

    const port = chrome.runtime.connect({ name: 'pull' });
    port.onMessage.addListener((event) => {
        if (event.error) {
            setProgress(0, `Download failed: ${event.error}`);
            $('#download').disabled = false;
            port.disconnect();
        } else if (event.done) {
            setProgress(1, 'Downloaded');
            port.disconnect();
            check();
        } else if (event.total) {
            setProgress(event.completed / event.total, `Downloading · ${gb(event.completed)} of ${gb(event.total)}`);
        } else {
            setProgress(null, event.status);
        }
    });
});

renderCommand();
check();
