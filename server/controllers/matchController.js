const Match = require('../models/Match');
const Item = require('../models/Item');

// @desc    Get matches for an item
// @route   GET /api/matches/:itemId
exports.getMatchesForItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const matches = await Match.find({
      $or: [{ lostItem: itemId }, { foundItem: itemId }],
      status: { $ne: 'rejected' },
    })
      .populate({
        path: 'lostItem',
        populate: { path: 'user', select: 'name email' },
      })
      .populate({
        path: 'foundItem',
        populate: { path: 'user', select: 'name email' },
      })
      .sort({ combinedScore: -1 });

    res.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all matches for current user's items
// @route   GET /api/matches
exports.getMyMatches = async (req, res, next) => {
  try {
    // Get user's items
    const userItems = await Item.find({ user: req.user._id }).select('_id');
    const itemIds = userItems.map(i => i._id);

    const matches = await Match.find({
      $or: [
        { lostItem: { $in: itemIds } },
        { foundItem: { $in: itemIds } },
      ],
      status: { $ne: 'rejected' },
    })
      .populate({
        path: 'lostItem',
        populate: { path: 'user', select: 'name email avatar' },
      })
      .populate({
        path: 'foundItem',
        populate: { path: 'user', select: 'name email avatar' },
      })
      .sort({ combinedScore: -1 });

    res.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update match status
// @route   PUT /api/matches/:id
exports.updateMatchStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be confirmed or rejected',
      });
    }

    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('lostItem')
      .populate('foundItem');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    // If confirmed, resolve both items
    if (status === 'confirmed') {
      await Item.findByIdAndUpdate(match.lostItem._id, { status: 'resolved' });
      await Item.findByIdAndUpdate(match.foundItem._id, { status: 'resolved' });
    }

    res.json({
      success: true,
      data: match,
    });
  } catch (error) {
    next(error);
  }
};
