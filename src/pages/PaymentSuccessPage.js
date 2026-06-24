import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { orderAPI } from '../api';
import { clearCartState } from '../redux/store';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('processing');
  const [dots, setDots] = useState('');
  const hasRun = useRef(false);

  // Animated dots for loading
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    placeOrderAfterPayment();
  }, []);

  const placeOrderAfterPayment = async () => {
    const address = localStorage.getItem('pendingShippingAddress');

    if (!address) {
      // Order already placed (page was refreshed)
      setStatus('success');
      setTimeout(() => navigate('/orders'), 2000);
      return;
    }

    // Retry logic — backend might be sleeping on Render free tier
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        await orderAPI.placeOrder(address);
        localStorage.removeItem('pendingShippingAddress');
        dispatch(clearCartState());
        setStatus('success');
        toast.success('Payment successful! Order placed 🎉');
        setTimeout(() => navigate('/orders'), 2000);
        return;
      } catch (err) {
        attempts++;
        const errorMsg = err.response?.data?.message || '';

        // If cart is empty, order was already placed
        if (errorMsg.toLowerCase().includes('cart is empty')) {
          localStorage.removeItem('pendingShippingAddress');
          dispatch(clearCartState());
          setStatus('success');
          setTimeout(() => navigate('/orders'), 2000);
          return;
        }

        // If more attempts left, wait and retry
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 sec between retries
        } else {
          setStatus('error');
        }
      }
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '80px' }}>
      {status === 'processing' && (
        <>
          <p style={{ fontSize: '48px' }}>⏳</p>
          <h2>Confirming your payment{dots}</h2>
          <p style={{ color: '#888' }}>Please wait, do not close this page.</p>
          <p style={{ color: '#aaa', fontSize: '13px', marginTop: '12px' }}>
            This may take up to 30 seconds on first load.
          </p>
        </>
      )}
      {status === 'success' && (
        <>
          <p style={{ fontSize: '48px' }}>✅</p>
          <h2 style={{ color: '#4caf50' }}>Payment Successful!</h2>
          <p style={{ color: '#888' }}>Redirecting to your orders...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <p style={{ fontSize: '48px' }}>⚠️</p>
          <h2 style={{ color: '#f44336' }}>Something went wrong</h2>
          <p style={{ color: '#888' }}>Your payment succeeded but order placement failed.</p>
          <p style={{ color: '#888', fontSize: '13px' }}>
            Don't worry — your payment is safe. Please contact support or check your orders page.
          </p>
          <button onClick={() => navigate('/orders')}
            style={{ marginTop: '16px', padding: '10px 24px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Check My Orders
          </button>
        </>
      )}
    </div>
  );
}