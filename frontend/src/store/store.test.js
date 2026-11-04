import store from './store';
import { toggle } from './themeSlice';

describe('theme persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it('loads the saved theme from localStorage on refresh', () => {
    localStorage.setItem('theme', 'dark');
    jest.resetModules();

    const persistedStore = require('./store').default;

    expect(persistedStore.getState().theme).toBe('dark');
  });

  it('persists the selected theme after toggling', () => {
    store.dispatch(toggle());

    expect(localStorage.getItem('theme')).toBe('dark');
    expect(store.getState().theme).toBe('dark');
  });
});
