const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  lostItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  foundItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  textScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  imageScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  combinedScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending',
  },
  notifiedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// Ensure unique pair
matchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });
matchSchema.index({ combinedScore: -1 });

module.exports = mongoose.model('Match', matchSchema);
