import { configureStore, createSlice } from '@reduxjs/toolkit';

// ---- Auth Slice ----
const userFromStorage = localStorage.getItem('user')
  ? JSON.parse(localStorage.getItem('user'))
  : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: userFromStorage,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    setAuthLoading: (state, action) => { state.loading = action.payload; },
    setAuthError: (state, action) => { state.error = action.payload; },
  },
});

// ---- Cart Slice ----
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], loading: false },
  reducers: {
    setCartItems: (state, action) => { state.items = action.payload; },
    setCartLoading: (state, action) => { state.loading = action.payload; },
    clearCartState: (state) => { state.items = []; },
  },
});

// ---- Wishlist Slice ----
const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { items: [] },
  reducers: {
    setWishlistItems: (state, action) => { state.items = action.payload; },
  },
});

// ---- Theme Slice ----
const themeSlice = createSlice({
  name: 'theme',
  initialState: { darkMode: false },
  reducers: {
    toggleDarkMode: (state) => { state.darkMode = !state.darkMode; },
  },
});

// ---- Store ----
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    cart: cartSlice.reducer,
    wishlist: wishlistSlice.reducer,
    theme: themeSlice.reducer,
  },
});

export const { setCredentials, logout, setAuthLoading, setAuthError } = authSlice.actions;
export const { setCartItems, setCartLoading, clearCartState } = cartSlice.actions;
export const { setWishlistItems } = wishlistSlice.actions;
export const { toggleDarkMode } = themeSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) =>
  state.cart.items.reduce((total, item) => total + item.subtotal, 0);
export const selectCartCount = (state) =>
  state.cart.items.reduce((count, item) => count + item.quantity, 0);
export const selectWishlistItems = (state) => state.wishlist.items;
export const selectIsInWishlist = (productId) => (state) =>
  state.wishlist.items.some(item => item.productId === productId);
export const selectDarkMode = (state) => state.theme.darkMode;