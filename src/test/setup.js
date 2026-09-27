import "@testing-library/jest-dom/vitest";

// Node 26 exposes a storage accessor without a backing file. Use the browser
// storage contract for DOM tests instead of inheriting that Node-only accessor.
const memory = new Map();
Object.defineProperty(window, "localStorage", { configurable: true, value: {
  getItem: key => memory.get(String(key)) ?? null,
  setItem: (key,value) => memory.set(String(key),String(value)),
  removeItem: key => memory.delete(String(key)), clear: () => memory.clear(),
} });
