import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { productAPI, cartAPI, reviewAPI } from '../api';
import { setCartItems, selectUser } from '../redux/store';

const s = {
  starBtn: { fontSize: '28px', cursor: 'pointer', background: 'none', border: 'none', padding: '2px' },
  reviewCard: { background: '#fff', padding: '16px', borderRadius: '10px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  reviewForm: { background: '#f8f8f8', padding: '20px', borderRadius: '12px', marginTop: '16px' },
  textarea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px', boxSizing: 'border-box', fontSize: '14px', marginTop: '10px' },
  submitBtn: { padding: '10px 24px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', marginTop: '10px' },
  recoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' },
  recoCard: { background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer' },
  recoImg: { width: '100%', height: '140px', objectFit: 'cover', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' },
  recoBody: { padding: '12px' },
};

function StarRating({ rating, onChange, readOnly }) {
  return (
    <div>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          style={{ ...s.starBtn, cursor: readOnly ? 'default' : 'pointer' }}
          onClick={() => !readOnly && onChange && onChange(star)}
          disabled={readOnly}
        >
          {star <= rating ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [ratingInfo, setRatingInfo] = useState({ averageRating: 0, totalReviews: 0 });
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI Recommendations state
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    setLoading(true);
    productAPI.getById(id)
      .then(res => {
        setProduct(res.data);
        loadRecommendations(res.data.category, res.data.id);
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));

    loadReviews();

    if (user) {
      reviewAPI.checkReviewed(id).then(res => setHasReviewed(res.data.hasReviewed));
    }
  }, [id, user]);

  // "AI-style" recommendation: same category, excluding current product, top 4
  const loadRecommendations = (category, currentId) => {
    if (!category) return;
    productAPI.byCategory(category)
      .then(res => {
        const filtered = res.data.filter(p => p.id !== currentId).slice(0, 4);
        setRecommendations(filtered);
      })
      .catch(() => {});
  };

  const loadReviews = () => {
    reviewAPI.getProductReviews(id).then(res => setReviews(res.data));
    reviewAPI.getProductRating(id).then(res => setRatingInfo(res.data));
  };

  const addToCart = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      await cartAPI.addItem(product.id, qty);
      const { data } = await cartAPI.getCart();
      dispatch(setCartItems(data));
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const submitReview = async () => {
    if (!user) { navigate('/login'); return; }
    if (newComment.trim().length === 0) {
      toast.error('Please write a comment');
      return;
    }
    setSubmitting(true);
    try {
      await reviewAPI.addReview(id, newRating, newComment);
      toast.success('Review submitted!');
      setShowReviewForm(false);
      setNewComment('');
      setNewRating(5);
      setHasReviewed(true);
      loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMyReview = async () => {
    if (!window.confirm('Delete your review?')) return;
    try {
      await reviewAPI.deleteReview(id);
      toast.success('Review deleted');
      setHasReviewed(false);
      loadReviews();
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Loading...</p>;
  if (!product) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Product not found.</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', border: 'none', background: 'none', cursor: 'pointer', color: '#e94560', fontSize: '15px' }}>
        ← Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ background: '#f5f5f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', minHeight: '280px' }}>
          {product.imageUrl ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '12px' }} /> : '📦'}
        </div>
        <div>
          {product.category && (
            <span style={{ background: '#f0f0f0', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', color: '#666' }}>
              {product.category}
            </span>
          )}
          <h1 style={{ fontSize: '24px', color: '#1a1a2e', marginTop: '12px' }}>{product.name}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
            <StarRating rating={Math.round(ratingInfo.averageRating)} readOnly />
            <span style={{ color: '#666', fontSize: '14px' }}>
              {ratingInfo.averageRating > 0 ? `${ratingInfo.averageRating} (${ratingInfo.totalReviews} reviews)` : 'No reviews yet'}
            </span>
          </div>

          <p style={{ fontSize: '28px', color: '#e94560', fontWeight: '700', margin: '12px 0' }}>
            ₹{product.price?.toFixed(2)}
          </p>
          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>{product.description}</p>
          <p style={{ color: product.stock > 0 ? '#4caf50' : '#f44336', fontWeight: '500', marginBottom: '16px' }}>
            {product.stock > 0 ? `✅ ${product.stock} items in stock` : '❌ Out of stock'}
          </p>

          {product.stock > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span>Quantity:</span>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: '32px', height: '32px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>−</button>
              <span style={{ fontSize: '18px', fontWeight: '600' }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={{ width: '32px', height: '32px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>+</button>
            </div>
          )}

          <button onClick={addToCart} disabled={product.stock === 0}
            style={{ width: '100%', padding: '14px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', cursor: 'pointer', fontWeight: '700', opacity: product.stock === 0 ? 0.5 : 1 }}>
            {product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
          </button>
        </div>
      </div>

      {/* AI RECOMMENDATIONS SECTION */}
      {recommendations.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ color: '#1a1a2e' }}>✨ You Might Also Like</h2>
          <div style={s.recoGrid}>
            {recommendations.map(rec => (
              <div key={rec.id} style={s.recoCard} onClick={() => navigate(`/products/${rec.id}`)}>
                <div style={s.recoImg}>
                  {rec.imageUrl
                    ? <img src={rec.imageUrl} alt={rec.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '📦'}
                </div>
                <div style={s.recoBody}>
                  <p style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a2e', marginBottom: '4px' }}>{rec.name}</p>
                  <p style={{ color: '#e94560', fontWeight: '700' }}>₹{rec.price?.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REVIEWS SECTION */}
      <div style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ color: '#1a1a2e' }}>Reviews ({ratingInfo.totalReviews})</h2>
          {user && !hasReviewed && !showReviewForm && (
            <button style={s.submitBtn} onClick={() => setShowReviewForm(true)}>
              Write a Review
            </button>
          )}
          {user && hasReviewed && (
            <button style={{ ...s.submitBtn, background: '#f44336' }} onClick={deleteMyReview}>
              Delete My Review
            </button>
          )}
        </div>

        {showReviewForm && (
          <div style={s.reviewForm}>
            <p style={{ marginBottom: '4px', fontWeight: '600' }}>Your Rating:</p>
            <StarRating rating={newRating} onChange={setNewRating} />
            <textarea
              style={s.textarea}
              placeholder="Share your experience with this product..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={s.submitBtn} onClick={submitReview} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button style={{ ...s.submitBtn, background: '#fff', color: '#333', border: '1px solid #ddd' }}
                onClick={() => setShowReviewForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <p style={{ color: '#888', marginTop: '16px' }}>No reviews yet. Be the first to review this product!</p>
        ) : (
          <div style={{ marginTop: '16px' }}>
            {reviews.map(review => (
              <div key={review.id} style={s.reviewCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong>{review.userName}</strong>
                  <span style={{ color: '#888', fontSize: '13px' }}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <StarRating rating={review.rating} readOnly />
                <p style={{ color: '#555', marginTop: '8px' }}>{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}