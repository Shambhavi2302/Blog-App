import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'theme';

const persistTheme = (theme) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }
};

const getPreferredTheme = () => {
  if (typeof window === 'undefined') return 'light';

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme;
  }

  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return 'light';
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: getPreferredTheme(),
  reducers: {
    toggle: (state) => {
      const nextTheme = state === 'dark' ? 'light' : 'dark';
      persistTheme(nextTheme);
      return nextTheme;
    },
    set: (state, action) => {
      const nextTheme = action.payload === 'dark' ? 'dark' : 'light';
      persistTheme(nextTheme);
      return nextTheme;
    },
  },
});

export const { toggle, set } = themeSlice.actions;
export default themeSlice.reducer;
