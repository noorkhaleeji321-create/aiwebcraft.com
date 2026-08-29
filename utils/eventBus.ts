export const dispatchCustomEvent = (eventName: string, detail?: any): void => {
  if (typeof window === 'undefined') return;
  try {
    if (typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
      return;
    }
  } catch {}

  try {
    const evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(eventName, true, true, detail);
    window.dispatchEvent(evt);
  } catch {
    try {
      const evt = document.createEvent('Event');
      evt.initEvent(eventName, true, true);
      window.dispatchEvent(evt);
    } catch (e) {
      console.warn(`[EventBus] Could not dispatch event ${eventName}:`, e);
    }
  }
};
