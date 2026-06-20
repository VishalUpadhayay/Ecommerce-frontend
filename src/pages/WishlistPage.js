import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { wishlistAPI, cartAPI } from '../api';
import { setCartItems } from '../redux/store';

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
  card: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer' },
  img: { width: '100%', height: '180px', objectFit: 'cover', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' },
  cardBody: { padding: '14px' },
  name: { fontWeight: '600', fontSize: '15px', marginBottom: '4px', color: '#1a1a2e' },
  price: { color: '#e94560', fontSize: '18px', fontWeight: '700', marginBottom: '8px' },
  btnRow: { display: 'flex', gap: '8px' },
  addBtn: { flex: 1, padding: '9px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  removeBtn: { padding: '9px 12px', background: '#fff', color: '#e94560', border: '1px solid #e94560', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
};

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = () => {
    wishlistAPI.getWishlist()
      .then(res => setItems(res.data))
      .catch(() => toast.error('Failed to load wishlist'))
      .finally(() => setLoading(false));
  };

  const removeItem = async (productId) => {
    try {
      await wishlistAPI.removeItem(productId);
      setItems(items.filter(i => i.productId !== productId));
      toast.success('Removed from wishlist');
    } catch (err) {
      toast.error('Failed to remove');
    }
  };

  const addToCart = async (productId) => {
    try {
      await cartAPI.addItem(productId, 1);
      const { data } = await cartAPI.getCart();
      dispatch(setCartItems(data));
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Loading wishlist...</p>;

  if (items.length === 0) return (
    <div style={{ textAlign: 'center', marginTop: '60px' }}>
      <p style={{ fontSize: '48px' }}>💝</p>
      <h2>Your wishlist is empty</h2>
      <button onClick={() => navigate('/')} style={{ padding: '10px 24px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '12px' }}>
        Browse Products
      </button>
    </div>
  );

  return (
    <div>
      <h1 style={{ color: '#1a1a2e', marginBottom: '20px' }}>💝 My Wishlist</h1>
      <div style={s.grid}>
        {items.map(item => (
          <div key={item.id} style={s.card} onClick={() => navigate(`/products/${item.productId}`)}>
            <div style={s.img}>
              {item.productImage
                ? <img src={item.productImage} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '📦'}
            </div>
            <div style={s.cardBody}>
              <p style={s.name}>{item.productName}</p>
              <p style={s.price}>₹{item.productPrice?.toFixed(2)}</p>
              <div style={s.btnRow} onClick={(e) => e.stopPropagation()}>
                <button style={s.addBtn} onClick={() => addToCart(item.productId)}>Add to Cart</button>
                <button style={s.removeBtn} onClick={() => removeItem(item.productId)}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}