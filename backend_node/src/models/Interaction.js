const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
    user_id: { type: String, required: true, index: true },   // anonymous UUID from client
    book_id: { type: String, required: false, default: null }, // Optional for 'search' actions
    action: { type: String, enum: ['click', 'rate', 'search', 'bookshelf'], required: true },
    rating: { type: Number, default: null },   // 1-5 for 'rate', null for 'click'
    review: { type: String, default: null },
    query: { type: String, default: null },    // For 'search' actions
    created_at: { type: Date, default: Date.now },
});

interactionSchema.index({ user_id: 1, action: 1 });
interactionSchema.index({ user_id: 1, book_id: 1 });
interactionSchema.index({ book_id: 1 });
interactionSchema.index({ created_at: -1 });

module.exports = mongoose.model('Interaction', interactionSchema);
