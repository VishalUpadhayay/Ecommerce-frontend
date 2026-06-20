import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser, selectCartCount, toggleDarkMode, selectDarkMode } from '../redux/store';

const styles = {
  nav: {
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  logo: { color: '#e94560', fontSize: '22px', fontWeight: 'bold', textDecoration: 'none' },
  links: { display: 'flex', gap: '20px', alignItems: 'center' },
  link: { color: '#fff', textDecoration: 'none', fontSize: '15px' },
  cartBtn: {
    background: '#e94560', color: '#fff', border: 'none',
    padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '14px',
  },
  logoutBtn: {
    background: 'transparent', color: '#aaa', border: '1px solid #aaa',
    padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '14px',
  },
  badge: {
    background: '#ff4444', color: '#fff', borderRadius: '50%',
    padding: '1px 6px', fontSize: '12px', marginLeft: '4px',
  },
};

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const cartCount = useSelector(selectCartCount);
  const darkMode = useSelector(selectDarkMode);

  const handleThemeToggle = () => {
    dispatch(toggleDarkMode());
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav style={{ ...styles.nav, background: darkMode ? '#0a0a14' : '#1a1a2e' }}>
      <Link to="/" style={styles.logo}>🛒 ShopEase</Link>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Products</Link>
        <button onClick={handleThemeToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
          {darkMode ? '☀️' : '🌙'}
        </button>

        {user ? (
          <>
            <Link to="/orders" style={styles.link}>My Orders</Link>
            <Link to="/wishlist" style={styles.link}>💝 Wishlist</Link>
            {user.role === 'ADMIN' && (
              <Link to="/admin" style={{ ...styles.link, color: '#ffd700' }}>Admin</Link>
            )}
            <button style={styles.cartBtn} onClick={() => navigate('/cart')}>
              Cart {cartCount > 0 && <span style={styles.badge}>{cartCount}</span>}
            </button>
            <span style={{ color: '#aaa', fontSize: '14px' }}>Hi, {user.name}</span>
            <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={{ ...styles.link, ...styles.cartBtn, textDecoration: 'none' }}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}