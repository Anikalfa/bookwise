const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  book_id:          { type: String, required: true, unique: true },
  book_title:       { type: String, required: true },
  author_id:        { type: String, default: '' },
  publisher_id:     { type: String, default: '' },
  category_id:      { type: String, default: '' },
  book_summary:     { type: String, default: '' },
  average_rating:   { type: Number, default: 0 },
  rating_count:     { type: Number, default: 0 },
  book_pages:       { type: Number, default: null },
  book_price:       { type: Number, default: null },
  offer_price:      { type: Number, default: null },
  book_url:         { type: String, default: '' },
  // These might not be in all DB docs but could be added by import script
  author:           { type: String, default: 'Unknown' },
  cover_url:        { type: String, default: '' },
  categories:       { type: [String], default: [] },
}, { timestamps: true });

// Ensure createdAt is indexed for the New Arrivals filter
bookSchema.index({ createdAt: -1 });

// Helper to map DB fields to frontend format
bookSchema.statics.toFrontend = function (book) {
  if (!book) return null;
  return {
    ...book,
    title: book.book_title || book.title || 'Unknown Title',
    description: book.book_summary || book.description || '',
    avg_rating: book.average_rating || book.avg_rating || 0,
    rating_count: book.rating_count || 0,
    categories: book.categories?.length ? book.categories : (book.category_id ? [book.category_id] : []),
    price: book.book_price || book.price || null,
    pages: book.book_pages || book.pages || null,
    author: book.author || 'Unknown Author',
    cover_url: book.cover_url || 'https://www.rokomari.com/files/200/images/Books/default_book_cover.jpg',
  };
};

// Indexes for common queries
bookSchema.index({ book_id: 1 }, { unique: true });
bookSchema.index({ author_id: 1 });
bookSchema.index({ publisher_id: 1 });
bookSchema.index({ category_id: 1 });
bookSchema.index({ average_rating: -1 });
bookSchema.index({ rating_count: -1 });
// Text index for search
bookSchema.index({ book_title: 'text' });

module.exports = mongoose.model('Book', bookSchema);
