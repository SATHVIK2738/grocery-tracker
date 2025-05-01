const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Item = require('../models/Item');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all items for a user
router.get('/', auth, async (req, res) => {
  try {
    const items = await Item.find({ user_id: req.userId })
      .sort({ expiry_date: 1 });
    res.json(items);
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({ message: 'Error getting items' });
  }
});

// Add new item
router.post('/', auth, async (req, res) => {
  try {
    const item = new Item({
      ...req.body,
      user_id: req.userId
    });

    await item.save();
    res.status(201).json(item);
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ message: 'Error adding item' });
  }
});

// Update item
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, user_id: req.userId },
      { ...req.body, updated_at: Date.now() },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Error updating item' });
  }
});

// Delete item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      user_id: req.userId
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Error deleting item' });
  }
});

// Get expiring items
router.get('/expiring', auth, async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const items = await Item.find({
      user_id: req.userId,
      expiry_date: {
        $gte: today,
        $lte: sevenDaysFromNow
      }
    }).sort({ expiry_date: 1 });

    res.json(items);
  } catch (error) {
    console.error('Error getting expiring items:', error);
    res.status(500).json({ message: 'Error getting expiring items' });
  }
});

module.exports = router; 