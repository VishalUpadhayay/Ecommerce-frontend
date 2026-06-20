import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { productAPI, cartAPI, wishlistAPI, aiAPI } from '../api';
import { setCartItems, selectUser } from '../redux/store';

const s = {
  searchRow: { display: 'flex', gap: '8px', marginBottom: '16px' },
  search: { flex: 1, padding: '12px 16px', fontSize: '16px', border: '2px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' },
  aiSearchBtn: { padding: '0 20px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' },
  aiNote: { background: '#f0eeff', border: '1px solid #d4cdfa', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#5b3fc4', marginBottom: '16px' },
  filters: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' },
  filterBtn: { padding: '6px 16px', borderRadius: '20px', border: '1px solid #ddd', cursor: 'pointer', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
  card: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'transform 0.2s', cursor: 'pointer' },
  cardImgWrapper: { position: 'relative' },
  heartBtn: { position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  img: { width: '100%', height: '180px', objectFit: 'cover', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' },
  cardBody: { padding: '14px' },
  name: { fontWeight: '600', fontSize: '15px', marginBottom: '4px', color: '#1a1a2e' },
  price: { color: '#e94560', fontSize: '18px', fontWeight: '700', marginBottom: '8px' },
  stock: { fontSize: '13px', color: '#888', marginBottom: '10px' },
  addBtn: { width: '100%', padding: '9px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '32px', marginBottom: '20px' },
  pageBtn: (active) => ({ width: '38px', height: '38px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer', fontSize: '14px', background: active ? '#1a1a2e' : '#fff', color: active ? '#fff' : '#333', fontWeight: active ? '700' : '400' }),
  navBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer', fontSize: '14px', background: '#fff' },
};

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Books', 'Home', 'Sports'];
const PAGE_SIZE = 8;

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // AI Search state
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [aiResults, setAiResults] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  useEffect(() => {
    loadProducts(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (user) {
      wishlistAPI.getWishlist().then(res => {
        setWishlistIds(new Set(res.data.map(item => item.productId)));
      }).catch(() => {});
    }
  }, [user]);

  const loadProducts = (page) => {
    setLoading(true);
    productAPI.getPaginated(page, PAGE_SIZE)
      .then(res => {
        setProducts(res.data.products);
        setTotalPages(res.data.totalPages);
        setTotalItems(res.data.totalItems);
      })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  };

  // Regular (non-AI) filter for current page data
  const filtered = aiMode && aiResults
    ? aiResults
    : products.filter(p => {
        const matchesCategory = category === 'All' || p.category === category;
        const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
      });

  const runAISearch = async () => {
    if (!search.trim()) {
      toast.error('Type something to search with AI');
      return;
    }
    setAiLoading(true);
    setAiMode(true);
    try {
      const { data } = await aiAPI.searchProducts(search);
      setAiResults(data.products);
      setAiNote(data.aiUnderstood);
    } catch (err) {
      toast.error('AI search failed, try again');
      setAiMode(false);
    } finally {
      setAiLoading(false);
    }
  };

  const clearAISearch = () => {
    setAiMode(false);
    setAiResults(null);
    setSearch('');
  };

  const addToCart = async (e, productId) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    try {
      await cartAPI.addItem(productId, 1);
      const { data } = await cartAPI.getCart();
      dispatch(setCartItems(data));
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const toggleWishlist = async (e, productId) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    try {
      if (wishlistIds.has(productId)) {
        await wishlistAPI.removeItem(productId);
        setWishlistIds(prev => { const s = new Set(prev); s.delete(productId); return s; });
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.addItem(productId);
        setWishlistIds(prev => new Set(prev).add(productId));
        toast.success('Added to wishlist!');
      }
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  };

  const goToPage = (page) => {
    if (page < 0 || page >= totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      pages.push(
        <button key={i} style={s.pageBtn(i === currentPage)} onClick={() => goToPage(i)}>
          {i + 1}
        </button>
      );
    }
    return pages;
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Loading products...</p>;

  return (
    <div>
      <h1 style={{ color: '#1a1a2e', marginBottom: '20px' }}>🛍️ Our Products</h1>

      <div style={s.searchRow}>
        <input
          style={s.search}
          placeholder="Search products, or try AI: 'cheap shoes under 1000'..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && runAISearch()}
        />
        <button style={s.aiSearchBtn} onClick={runAISearch} disabled={aiLoading}>
          {aiLoading ? '🔄 Thinking...' : '✨ AI Search'}
        </button>
      </div>

      {aiMode && (
        <div style={s.aiNote}>
          🤖 {aiNote}
          <button onClick={clearAISearch} style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#5b3fc4', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>
            Clear AI search
          </button>
        </div>
      )}

      {!aiMode && (
        <div style={s.filters}>
          {CATEGORIES.map(cat => (
            <button key={cat} style={{
              ...s.filterBtn,
              background: category === cat ? '#1a1a2e' : '#fff',
              color: category === cat ? '#fff' : '#333',
            }} onClick={() => setCategory(cat)}>{cat}</button>
          ))}
        </div>
      )}

      <p style={{ color: '#888', fontSize: '14px', marginBottom: '12px' }}>
        Showing {filtered.length} {aiMode ? 'AI-matched' : `of ${totalItems} total`} products
      </p>

      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>
          No products found.
        </p>
      ) : (
        <div style={s.grid}>
          {filtered.map(product => (
            <div key={product.id} style={s.card}
              onClick={() => navigate(`/products/${product.id}`)}>
              <div style={s.cardImgWrapper}>
                <div style={s.img}>
                  {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '📦'}
                </div>
                <button style={s.heartBtn} onClick={(e) => toggleWishlist(e, product.id)}>
                  {wishlistIds.has(product.id) ? '❤️' : '🤍'}
                </button>
              </div>
              <div style={s.cardBody}>
                <p style={s.name}>{product.name}</p>
                {product.category && (
                  <span style={{ fontSize: '12px', background: '#f0f0f0', padding: '2px 8px', borderRadius: '10px', color: '#666' }}>
                    {product.category}
                  </span>
                )}
                <p style={s.price}>₹{product.price?.toFixed(2)}</p>
                <p style={s.stock}>{product.stock > 0 ? `${product.stock} in stock` : '❌ Out of stock'}</p>
                <button style={{
                  ...s.addBtn,
                  opacity: product.stock === 0 ? 0.5 : 1,
                  cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                }}
                  onClick={(e) => product.stock > 0 && addToCart(e, product.id)}
                  disabled={product.stock === 0}>
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!aiMode && totalPages > 1 && (
        <div style={s.pagination}>
          <button style={s.navBtn} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}>
            ← Prev
          </button>
          {renderPageNumbers()}
          <button style={s.navBtn} onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages - 1}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}