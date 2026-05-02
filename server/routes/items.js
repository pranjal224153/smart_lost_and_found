const express = require('express');
const router = express.Router();
const {
  createItem, getItems, getMyItems, getItem,
  updateItem, deleteItem, resolveItem,
} = require('../controllers/itemController');
const auth = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.route('/')
  .get(getItems)
  .post(auth, upload.single('image'), createItem);

router.get('/my', auth, getMyItems);

router.route('/:id')
  .get(getItem)
  .put(auth, upload.single('image'), updateItem)
  .delete(auth, deleteItem);

router.put('/:id/resolve', auth, resolveItem);

module.exports = router;
