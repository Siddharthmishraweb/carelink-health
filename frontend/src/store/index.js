import { configureStore, createSlice } from '@reduxjs/toolkit';

const saved = JSON.parse(localStorage.getItem('carelink.auth') || 'null');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: saved?.token || null,
    user: saved?.user || null,
    extras: saved?.extras || {},
    locale: localStorage.getItem('carelink.locale') || 'en',
  },
  reducers: {
    setAuth(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.extras = action.payload.extras || {};
      localStorage.setItem('carelink.auth', JSON.stringify(state));
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.extras = {};
      localStorage.removeItem('carelink.auth');
    },
    setLocale(state, action) {
      state.locale = action.payload;
      localStorage.setItem('carelink.locale', action.payload);
    },
  },
});

export const { setAuth, logout, setLocale } = authSlice.actions;
export const store = configureStore({ reducer: { auth: authSlice.reducer } });
