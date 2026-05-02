const express = require('express');
const router = express.Router();
const {
  getMatchesForItem, getMyMatches, updateMatchStatus,
} = require('../controllers/matchController');
const auth = require('../middleware/auth');

router.get('/', auth, getMyMatches);
router.get('/:itemId', auth, getMatchesForItem);
router.put('/:id', auth, updateMatchStatus);

module.exports = router;
