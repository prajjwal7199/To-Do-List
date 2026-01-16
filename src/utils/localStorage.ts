const PREFIX = "todo_mui_rtk_v1_";

export function saveState<T>(key: string, state: T) {
  try {
    const s = JSON.stringify(state);
    localStorage.setItem(PREFIX + key, s);
  } catch (e) {
    // ignore
  }
}

export function loadState<T>(key: string): T | undefined {
  try {
    const s = localStorage.getItem(PREFIX + key);
    if (!s) return undefined;
    return JSON.parse(s) as T;
  } catch (e) {
    return undefined;
  }
}
