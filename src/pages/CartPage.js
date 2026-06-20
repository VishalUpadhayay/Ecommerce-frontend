import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { cartAPI, paymentAPI } from '../api';
import { setCartItems, selectCartItems, selectCartTotal } from '../redux/store';

const s = {
  row: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#fff', borderRadius: '10px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  img: { width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' },
  name: { fontWeight: '600', color: '#1a1a2e' },
  qty: { display: 'flex', alignItems: 'center', gap: '10px' },
  qtyBtn: { width: '28px', height: '28px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', background: '#f5f5f5' },
  removeBtn: { color: '#e94560', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' },
  summary: { background: '#1a1a2e', color: '#fff', padding: '24px', borderRadius: '12px', marginTop: '20px' },
  checkoutBtn: { width: '100%', padding: '14px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: '700', marginTop: '12px' },
};

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const [address, setAddress] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    cartAPI.getCart().then(res => dispatch(setCartItems(res.data)));
  }, [dispatch]);

  const updateQty = async (itemId, qty) => {
    await cartAPI.updateItem(itemId, qty);
    const { data } = await cartAPI.getCart();
    dispatch(setCartItems(data));
  };

  const remove = async (itemId) => {
    await cartAPI.removeItem(itemId);
    const { data } = await cartAPI.getCart();
    dispatch(setCartItems(data));
    toast.success('Item removed');
  };

  // NEW: Instead of placing order directly, redirect to Stripe payment page
  const proceedToPayment = async () => {
    if (!address.trim()) { toast.error('Enter shipping address'); return; }
    setPlacing(true);
    try {
      // Save address temporarily so PaymentSuccessPage can use it after payment
      localStorage.setItem('pendingShippingAddress', address);

      const { data } = await paymentAPI.createCheckoutSession(total);
      // Redirect browser to Stripe's hosted payment page
      window.location.href = data.checkoutUrl;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start payment');
      setPlacing(false);
    }
  };

  if (items.length === 0) return (
    <div style={{ textAlign: 'center', marginTop: '60px' }}>
      <p style={{ fontSize: '48px' }}>🛒</p>
      <h2>Your cart is empty</h2>
      <button onClick={() => navigate('/')} style={{ padding: '10px 24px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
        Shop Now
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ color: '#1a1a2e' }}>🛒 Your Cart</h1>

      {items.map(item => (
        <div key={item.id} style={s.row}>
          <div style={s.img}>
            {item.productImage
              ? <img src={item.productImage} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
              : '📦'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={s.name}>{item.productName}</p>
            <p style={{ color: '#e94560', fontWeight: '700' }}>₹{item.productPrice?.toFixed(2)}</p>
          </div>
          <div style={s.qty}>
            <button style={s.qtyBtn} onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
            <span>{item.quantity}</span>
            <button style={s.qtyBtn} onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
          </div>
          <div>
            <p style={{ fontWeight: '700' }}>₹{item.subtotal?.toFixed(2)}</p>
            <button style={s.removeBtn} onClick={() => remove(item.id)}>Remove</button>
          </div>
        </div>
      ))}

      <div style={s.summary}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span>Subtotal</span><span>₹{total.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span>Shipping</span><span>Free</span>
        </div>
        <hr style={{ borderColor: '#333' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '700', marginTop: '12px' }}>
          <span>Total</span><span>₹{total.toFixed(2)}</span>
        </div>

        {showCheckout ? (
          <>
            <textarea
              placeholder="Enter full shipping address..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '16px', borderRadius: '8px', border: 'none', fontSize: '14px', minHeight: '80px', boxSizing: 'border-box' }}
            />
            <button style={s.checkoutBtn} onClick={proceedToPayment} disabled={placing}>
              {placing ? 'Redirecting to payment...' : '💳 Pay Now with Stripe'}
            </button>
            <button onClick={() => setShowCheckout(false)}
              style={{ ...s.checkoutBtn, background: 'transparent', border: '1px solid #555', marginTop: '8px' }}>
              Cancel
            </button>
          </>
        ) : (
          <button style={s.checkoutBtn} onClick={() => setShowCheckout(true)}>
            Proceed to Checkout →
          </button>
        )}
      </div>
    </div>
  );
}