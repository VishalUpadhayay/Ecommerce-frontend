import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productAPI, orderAPI } from '../api';

const s = {
  tabs: { display: 'flex', gap: '12px', marginBottom: '24px' },
  tab: (active) => ({ padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', background: active ? '#1a1a2e' : '#f0f0f0', color: active ? '#fff' : '#333' }),
  form: { background: '#fff', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  input: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '12px', boxSizing: 'border-box', fontSize: '14px' },
  row: (i) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }),
  btn: (color) => ({ padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', background: color, color: '#fff', marginLeft: '6px' }),
};

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminPage() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: '', imageUrl: '' });
  const [editId, setEditId] = useState(null);

  const loadProducts = () => productAPI.getAll().then(r => setProducts(r.data));
  const loadOrders = () => orderAPI.getAllOrders().then(r => setOrders(r.data));

  useEffect(() => { loadProducts(); loadOrders(); }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) };
    try {
      if (editId) {
        await productAPI.update(editId, payload);
        toast.success('Product updated!');
      } else {
        await productAPI.create(payload);
        toast.success('Product created!');
      }
      setForm({ name: '', description: '', price: '', stock: '', category: '', imageUrl: '' });
      setEditId(null);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await productAPI.delete(id);
    toast.success('Deleted');
    loadProducts();
  };

  const editProduct = (p) => {
    setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, category: p.category || '', imageUrl: p.imageUrl || '' });
    setEditId(p.id);
    setTab('products');
    window.scrollTo(0, 0);
  };

  const updateOrderStatus = async (orderId, status) => {
    await orderAPI.updateStatus(orderId, status);
    toast.success('Status updated');
    loadOrders();
  };

  return (
    <div>
      <h1 style={{ color: '#1a1a2e' }}>🔧 Admin Dashboard</h1>

      <div style={s.tabs}>
        <button style={s.tab(tab === 'products')} onClick={() => setTab('products')}>Products</button>
        <button style={s.tab(tab === 'orders')} onClick={() => setTab('orders')}>Orders ({orders.length})</button>
      </div>

      {tab === 'products' && (
        <>
          {/* Product Form */}
          <div style={s.form}>
            <h3 style={{ marginBottom: '16px' }}>{editId ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input style={s.input} name="name" placeholder="Product Name *" value={form.name} onChange={handleChange} required />
                <input style={s.input} name="category" placeholder="Category" value={form.category} onChange={handleChange} />
                <input style={s.input} type="number" name="price" placeholder="Price *" value={form.price} onChange={handleChange} required min="0.01" step="0.01" />
                <input style={s.input} type="number" name="stock" placeholder="Stock *" value={form.stock} onChange={handleChange} required min="0" />
              </div>
              <input style={s.input} name="imageUrl" placeholder="Image URL" value={form.imageUrl} onChange={handleChange} />
              <textarea style={{ ...s.input, minHeight: '70px' }} name="description" placeholder="Description" value={form.description} onChange={handleChange} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ padding: '10px 24px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                  {editId ? 'Update Product' : 'Add Product'}
                </button>
                {editId && (
                  <button type="button" onClick={() => { setEditId(null); setForm({ name: '', description: '', price: '', stock: '', category: '', imageUrl: '' }); }}
                    style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Products List */}
          <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ ...s.row(0), fontWeight: '700', background: '#f8f8f8' }}>
              <span style={{ flex: 2 }}>Name</span>
              <span>Price</span><span>Stock</span><span>Category</span><span>Actions</span>
            </div>
            {products.map((p, i) => (
              <div key={p.id} style={s.row(i)}>
                <span style={{ flex: 2, fontWeight: '500' }}>{p.name}</span>
                <span>₹{p.price}</span>
                <span style={{ color: p.stock < 5 ? '#e94560' : '#333' }}>{p.stock}</span>
                <span style={{ color: '#888', fontSize: '13px' }}>{p.category || '-'}</span>
                <span>
                  <button style={s.btn('#2196f3')} onClick={() => editProduct(p)}>Edit</button>
                  <button style={s.btn('#f44336')} onClick={() => deleteProduct(p.id)}>Delete</button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'orders' && (
        <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {orders.map((order, i) => (
            <div key={order.id} style={{ ...s.row(i), flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                <div>
                  <strong>Order #{order.id}</strong>
                  <span style={{ marginLeft: '12px', color: '#888', fontSize: '13px' }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <strong style={{ color: '#e94560' }}>₹{order.totalAmount?.toFixed(2)}</strong>
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                {order.items?.map(it => `${it.productName} ×${it.quantity}`).join(' | ')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>Status:</span>
                <select value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
