type Listener = () => void;

let onUnauthorized: Listener | null = null;

export function registerUnauthorizedHandler(fn: Listener) {
  onUnauthorized = fn;
}

export function triggerUnauthorized() {
  onUnauthorized?.();
}