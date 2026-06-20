import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { orderAPI } from '../api';
import { clearCartState } from '../redux/store';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('processing'); // processing | success | error
  const hasRun = useRef(false); // Guards against double execution (React StrictMode)

  useEffect(() => {
    // Prevent this from running twice
    if (hasRun.current) return;
    hasRun.current = true;

    placeOrderAfterPayment();
  }, []);

  const placeOrderAfterPayment = async () => {
    const address = localStorage.getItem('pendingShippingAddress');

    // If address is already gone, order was already placed successfully once
    if (!address) {
      setStatus('success');
      return;
    }

    try {
      await orderAPI.placeOrder(address);

      localStorage.removeItem('pendingShippingAddress');
      dispatch(clearCartState());
      setStatus('success');
      toast.success('Payment successful! Order placed 🎉');

      setTimeout(() => navigate('/orders'), 2000);
    } catch (err) {
      // If the error is "cart is empty", it likely means order was already placed - treat as success
      const errorMsg = err.response?.data?.message || '';
      if (errorMsg.toLowerCase().includes('cart is empty')) {
        localStorage.removeItem('pendingShippingAddress');
        dispatch(clearCartState());
        setStatus('success');
        setTimeout(() => navigate('/orders'), 2000);
        return;
      }

      setStatus('error');
      toast.error('Payment succeeded but order placement failed. Contact support.');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '80px' }}>
      {status === 'processing' && (
        <>
          <p style={{ fontSize: '48px' }}>⏳</p>
          <h2>Confirming your payment...</h2>
          <p style={{ color: '#888' }}>Please wait, do not close this page.</p>
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
          <p style={{ color: '#888' }}>Your payment succeeded, but we couldn't create your order automatically.</p>
          <button onClick={() => navigate('/')} style={{ marginTop: '16px', padding: '10px 24px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Go to Home
          </button>
        </>
      )}
    </div>
  );
}