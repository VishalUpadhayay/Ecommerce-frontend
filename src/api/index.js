import axios from 'axios';

// Base URL - proxy in package.json routes /api to http://localhost:8080
const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// REQUEST interceptor: attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE interceptor: handle 401 (token expired → redirect to login)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---- Auth API ----
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
};

// ---- Product API ----
export const productAPI = {
  getAll: () => API.get('/products'),
  getPaginated: (page, size) => API.get(`/products?page=${page}&size=${size}`),
  getById: (id) => API.get(`/products/${id}`),
  search: (keyword) => API.get(`/products/search?keyword=${keyword}`),
  byCategory: (cat) => API.get(`/products/category/${cat}`),
  create: (data) => API.post('/products', data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
};

// ---- Cart API ----
export const cartAPI = {
  getCart: () => API.get('/cart'),
  addItem: (productId, quantity) => API.post('/cart/add', { productId, quantity }),
  updateItem: (itemId, quantity) => API.put(`/cart/${itemId}`, { quantity }),
  removeItem: (itemId) => API.delete(`/cart/${itemId}`),
  clearCart: () => API.delete('/cart'),
};

// ---- Order API ----
export const orderAPI = {
  placeOrder: (shippingAddress) => API.post('/orders', { shippingAddress }),
  getMyOrders: () => API.get('/orders'),
  getOrder: (id) => API.get(`/orders/${id}`),
  getAllOrders: () => API.get('/orders/admin/all'),
  updateStatus: (id, status) => API.put(`/orders/admin/${id}/status`, { status }),
};

// ---- Wishlist API ----
export const wishlistAPI = {
  getWishlist: () => API.get('/wishlist'),
  addItem: (productId) => API.post('/wishlist/add', { productId }),
  removeItem: (productId) => API.delete(`/wishlist/${productId}`),
  checkItem: (productId) => API.get(`/wishlist/check/${productId}`),
};

// ---- Review API ----
export const reviewAPI = {
  getProductReviews: (productId) => API.get(`/reviews/product/${productId}`),
  getProductRating: (productId) => API.get(`/reviews/product/${productId}/rating`),
  addReview: (productId, rating, comment) => API.post('/reviews', { productId, rating, comment }),
  updateReview: (productId, rating, comment) => API.put(`/reviews/product/${productId}`, { rating, comment }),
  deleteReview: (productId) => API.delete(`/reviews/product/${productId}`),
  checkReviewed: (productId) => API.get(`/reviews/check/${productId}`),
};

// ---- Payment API ----
export const paymentAPI = {
  createCheckoutSession: (amount) => API.post('/payment/create-checkout-session', { amount }),
};

// ---- Chat API ----
export const chatAPI = {
  sendMessage: (message) => API.post('/chat', { message }),
};

// ---- AI Search & Order Assistant API ----
export const aiAPI = {
  searchProducts: (query) => API.post('/ai-search', { query }),
  askOrderAssistant: (question) => API.post('/ai-order-assistant', { question }),
};

export default API;