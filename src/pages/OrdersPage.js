import React, { useEffect, useState } from 'react';
import { orderAPI } from '../api';

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

const s = {
  card: { background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  itemRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px' },
  progressWrap: { display: 'flex', alignItems: 'center', margin: '20px 0' },
  stepCircle: (active, done) => ({
    width: '28px', height: '28px', borderRadius: '50%',
    background: done || active ? '#1a1a2e' : '#e0e0e0',
    color: done || active ? '#fff' : '#999',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '700', flexShrink: 0,
  }),
  stepLine: (done) => ({
    flex: 1, height: '3px', background: done ? '#1a1a2e' : '#e0e0e0', margin: '0 4px',
  }),
  stepLabel: { fontSize: '11px', color: '#666', marginTop: '6px', textAlign: 'center' },
  cancelledBadge: { display: 'inline-block', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: '#f4433622', color: '#f44336' },
};

function OrderProgressBar({ status }) {
  if (status === 'CANCELLED') {
    return <span style={s.cancelledBadge}>❌ Order Cancelled</span>;
  }

  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <div>
      <div style={s.progressWrap}>
        {STATUS_STEPS.map((step, index) => (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={s.stepCircle(index === currentIndex, index < currentIndex)}>
                {index < currentIndex ? '✓' : index + 1}
              </div>
            </div>
            {index < STATUS_STEPS.length - 1 && (
              <div style={s.stepLine(index < currentIndex)} />
            )}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {STATUS_STEPS.map(step => (
          <span key={step} style={{ ...s.stepLabel, flex: 1 }}>{step}</span>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getMyOrders()
      .then(res => setOrders(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Loading orders...</p>;

  if (orders.length === 0) return (
    <div style={{ textAlign: 'center', marginTop: '60px' }}>
      <p style={{ fontSize: '48px' }}>📦</p>
      <h2>No orders yet</h2>
    </div>
  );

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ color: '#1a1a2e' }}>📦 My Orders</h1>
      {orders.map(order => (
        <div key={order.id} style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <strong>Order #{order.id}</strong>
              <p style={{ color: '#888', fontSize: '13px', margin: '4px 0' }}>
                {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <strong style={{ color: '#e94560', fontSize: '16px' }}>₹{order.totalAmount?.toFixed(2)}</strong>
          </div>

          <OrderProgressBar status={order.status} />

          {order.items?.map((item, i) => (
            <div key={i} style={s.itemRow}>
              <span>{item.productName} × {item.quantity}</span>
              <span style={{ fontWeight: '600' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}

          <p style={{ color: '#888', fontSize: '13px', marginTop: '12px' }}>📍 {order.shippingAddress}</p>
        </div>
      ))}
    </div>
  );
}