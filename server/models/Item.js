const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['lost', 'found'],
    required: [true, 'Item type is required'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'electronics', 'documents', 'keys', 'wallet', 'bag',
      'clothing', 'jewelry', 'pet', 'other',
    ],
  },
  imageUrl: {
    type: String,
    default: '',
  },
  imagePublicId: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  location: {
    text: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  venue: {
    type: String,
    trim: true,
    default: '',
  },
  storageLocation: {
    type: String,
    trim: true,
    default: '',
  },
  contactName: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    trim: true,
  },
  contactPhone: {
    type: String,
    default: '',
    trim: true,
  },
  status: {
    type: String,
    enum: ['open', 'resolved'],
    default: 'open',
  },
  textEmbedding: {
    type: [Number],
    default: [],
    select: false,
  },
  imageEmbedding: {
    type: [Number],
    default: [],
    select: false,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
itemSchema.index({ type: 1, status: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ user: 1 });

module.exports = mongoose.model('Item', itemSchema);
