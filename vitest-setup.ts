/**
 * Vitest setup file - provides browser globals for Node.js test environment
 */

// Polyfill sessionStorage if not available (Node.js environment)
if (typeof sessionStorage === 'undefined') {
  let sessionStorageData: Record<string, string> = {};

  (global as any).sessionStorage = {
    getItem: (key: string): string | null => sessionStorageData[key] ?? null,
    setItem: (key: string, value: string): void => {
      sessionStorageData[key] = value;
    },
    removeItem: (key: string): void => {
      delete sessionStorageData[key];
    },
    clear: (): void => {
      sessionStorageData = {};
    },
    key: (index: number): string | null => {
      const keys = Object.keys(sessionStorageData);
      return keys[index] ?? null;
    },
    get length(): number {
      return Object.keys(sessionStorageData).length;
    },
  };
}
