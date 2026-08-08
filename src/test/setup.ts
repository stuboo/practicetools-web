import '@testing-library/jest-dom/vitest'

// jsdom implements no layout, so it ships no ResizeObserver. Radix's Slider
// measures its thumb on mount and throws without one, which takes down any
// test that renders the radius filter.
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
