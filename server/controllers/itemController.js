const Item = require('../models/Item');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const { uploadToCloudinary, saveLocally } = require('../middleware/upload');
const mlClient = require('../utils/mlClient');
const cloudinary = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

// @desc    Create item (lost or found)
// @route   POST /api/items
exports.createItem = async (req, res, next) => {
  try {
    const {
      type, title, description, category, date,
      locationText, locationLat, locationLng,
      venue, storageLocation,
      contactName, contactEmail, contactPhone,
    } = req.body;

    // Build item data
    const itemData = {
      user: req.user._id,
      type,
      title,
      description,
      category,
      date,
      location: {
        text: locationText,
        coordinates: {
          lat: locationLat ? parseFloat(locationLat) : null,
          lng: locationLng ? parseFloat(locationLng) : null,
        },
      },
      venue: venue || '',
      storageLocation: storageLocation || '',
      contactName,
      contactEmail,
      contactPhone: contactPhone || '',
    };

    // Handle image upload
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        itemData.imageUrl = result.secure_url;
        itemData.imagePublicId = result.public_id;
      } catch (uploadError) {
        console.warn('Cloudinary upload failed, falling back to local storage:', uploadError.message);
        try {
          const localResult = await saveLocally(req.file.buffer, req.file.originalname);
          itemData.imageUrl = localResult.secure_url;
          itemData.imagePublicId = localResult.public_id;
        } catch (localError) {
          console.error('Local upload also failed:', localError);
        }
      }
    }

    const item = await Item.create(itemData);

    // Trigger async matching (let it run in background for speedy API response)
    triggerMatching(item).catch(err => console.error('Match trigger error:', err));

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// Background matching function
async function triggerMatching(newItem) {
  const oppositeType = newItem.type === 'lost' ? 'found' : 'lost';

  // Get open items of opposite type in the same category (or all if few items)
  const candidates = await Item.find({
    type: oppositeType,
    status: 'open',
    _id: { $ne: newItem._id },
  }).limit(50);

  if (candidates.length === 0) return;

  // Call ML service for matching
  const matchResults = await mlClient.findMatches(newItem, candidates);

  if (!matchResults || matchResults.length === 0) return;

  // Save matches above threshold
  for (const result of matchResults) {
    if (result.combined_score < 0.50) continue;

    const lostItem = newItem.type === 'lost' ? newItem._id : result.candidate_id;
    const foundItem = newItem.type === 'found' ? newItem._id : result.candidate_id;

    try {
      const existingMatch = await Match.findOne({ lostItem, foundItem });
      let shouldUpdate = true;
      if (existingMatch) {
        const isNewLocal = !result.analysis || result.analysis.includes('Jaccard') || result.analysis.includes('local');
        const isExistingAI = existingMatch.analysis && !existingMatch.analysis.includes('Jaccard') && !existingMatch.analysis.includes('local');
        if (isNewLocal && isExistingAI) {
          shouldUpdate = false;
        }
      }

      if (shouldUpdate) {
        await Match.findOneAndUpdate(
          { lostItem, foundItem },
          {
            lostItem,
            foundItem,
            textScore: result.text_score || 0,
            imageScore: result.image_score || 0,
            combinedScore: result.combined_score || 0,
            analysis: result.analysis || '',
          },
          { upsert: true, new: true }
        );
      }

      // Create notifications for both users
      const candidateItem = candidates.find(c => c._id.toString() === result.candidate_id);
      if (candidateItem) {
        const matchPercent = Math.round(result.combined_score * 100);

        // Notify the new item's owner
        await Notification.create({
          user: newItem.user,
          type: 'match_found',
          title: 'Potential Match Found!',
          message: `Your ${newItem.type} item "${newItem.title}" has a ${matchPercent}% match.`,
          relatedMatch: match._id,
          relatedItem: candidateItem._id,
        });

        // Notify the candidate item's owner
        await Notification.create({
          user: candidateItem.user,
          type: 'match_found',
          title: 'Potential Match Found!',
          message: `A ${newItem.type} item "${newItem.title}" is a ${matchPercent}% match for your "${candidateItem.title}".`,
          relatedMatch: match._id,
          relatedItem: newItem._id,
        });
      }
    } catch (err) {
      // Skip duplicate matches
      if (err.code !== 11000) console.error('Match save error:', err);
    }
  }
}

// @desc    Get all items (with filters)
// @route   GET /api/items
exports.getItems = async (req, res, next) => {
  try {
    const { type, category, status, search, sort, page = 1, limit = 12 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOpt = { createdAt: -1 };
    if (sort === 'oldest') sortOpt = { createdAt: 1 };
    if (sort === 'title') sortOpt = { title: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      Item.find(query)
        .populate('user', 'name email avatar')
        .sort(sortOpt)
        .skip(skip)
        .limit(parseInt(limit)),
      Item.countDocuments(query),
    ]);

    // Add match counts
    const itemIds = items.map(i => i._id);
    const matchCounts = await Match.aggregate([
      { $match: { $or: [{ lostItem: { $in: itemIds } }, { foundItem: { $in: itemIds } }], status: { $ne: 'rejected' } } },
      { $project: { items: ['$lostItem', '$foundItem'] } },
      { $unwind: '$items' },
      { $match: { items: { $in: itemIds } } },
      { $group: { _id: '$items', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    matchCounts.forEach(c => { countMap[c._id.toString()] = c.count; });

    const itemsWithMatches = items.map(item => ({
      ...item.toObject(),
      matchCount: countMap[item._id.toString()] || 0
    }));

    res.json({
      success: true,
      data: itemsWithMatches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's items
// @route   GET /api/items/my
exports.getMyItems = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const query = { user: req.user._id };
    if (type) query.type = type;
    if (status) query.status = status;

    const items = await Item.find(query).sort({ createdAt: -1 });

    // Add match counts
    const itemIds = items.map(i => i._id);
    const matchCounts = await Match.aggregate([
      { $match: { $or: [{ lostItem: { $in: itemIds } }, { foundItem: { $in: itemIds } }], status: { $ne: 'rejected' } } },
      { $project: { items: ['$lostItem', '$foundItem'] } },
      { $unwind: '$items' },
      { $match: { items: { $in: itemIds } } },
      { $group: { _id: '$items', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    matchCounts.forEach(c => { countMap[c._id.toString()] = c.count; });

    const itemsWithMatches = items.map(item => ({
      ...item.toObject(),
      matchCount: countMap[item._id.toString()] || 0
    }));

    res.json({
      success: true,
      data: itemsWithMatches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single item
// @route   GET /api/items/:id
exports.getItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('user', 'name email avatar phone');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update item
// @route   PUT /api/items/:id
exports.updateItem = async (req, res, next) => {
  try {
    let item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this item',
      });
    }

    // Handle new image upload
    if (req.file) {
      // Delete old image from Cloudinary
      if (item.imagePublicId) {
        await cloudinary.uploader.destroy(item.imagePublicId);
      }
      const result = await uploadToCloudinary(req.file.buffer);
      req.body.imageUrl = result.secure_url;
      req.body.imagePublicId = result.public_id;
    }

    // Handle location
    if (req.body.locationText) {
      req.body.location = {
        text: req.body.locationText,
        coordinates: {
          lat: req.body.locationLat ? parseFloat(req.body.locationLat) : null,
          lng: req.body.locationLng ? parseFloat(req.body.locationLng) : null,
        },
      };
    }

    item = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete item
// @route   DELETE /api/items/:id
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this item',
      });
    }

    // Delete image (Resilient deletion)
    if (item.imagePublicId) {
      try {
        if (item.imageUrl && item.imageUrl.startsWith('/uploads/')) {
          // Delete local file
          const filePath = path.join(__dirname, '../public', item.imageUrl);
          if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
          }
        } else {
          // Delete from Cloudinary
          await cloudinary.uploader.destroy(item.imagePublicId);
        }
      } catch (err) {
        console.warn('Image deletion failed:', err.message);
        // Continue even if image deletion fails
      }
    }

    // Delete associated matches
    await Match.deleteMany({
      $or: [{ lostItem: item._id }, { foundItem: item._id }],
    });

    await Item.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Item deleted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve item
// @route   PUT /api/items/:id/resolve
exports.resolveItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this item',
      });
    }

    item.status = 'resolved';
    await item.save();

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Re-trigger matching for an existing item
// @route   POST /api/items/:id/rematch
exports.rematchItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    triggerMatching(item).catch(err => console.error('Rematch error:', err));
    res.json({ success: true, message: 'Matching started. You will be notified instantly when matches are found.' });
  } catch (error) {
    next(error);
  }
};
