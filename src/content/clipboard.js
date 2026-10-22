(() => {
  const { writeText, write } = Clipboard.prototype;

  function handOff(plain, html) {
    const event = new CustomEvent('safepaste:copy', { detail: JSON.stringify({ plain, html }), cancelable: true });
    document.dispatchEvent(event);
    return event.defaultPrevented;
  }

  Clipboard.prototype.writeText = function (text) {
    if (handOff(String(text), null)) return Promise.resolve();
    return writeText.call(this, text);
  };

  Clipboard.prototype.write = async function (items) {
    const item = items?.length === 1 ? items[0] : null;
    if (item && item.types.every((type) => type === 'text/plain' || type === 'text/html')) {
      const read = async (type) => (item.types.includes(type) ? (await item.getType(type)).text() : null);
      const [plain, html] = await Promise.all([read('text/plain'), read('text/html')]);
      if (handOff(plain, html)) return;
    }
    return write.call(this, items);
  };
})();
