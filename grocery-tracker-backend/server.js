require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { sendExpiryNotification } = require('./services/emailService');
const User = require('./models/User');
const Item = require('./models/Item');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/grocery-tracker')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/items', require('./routes/items'));

// Function to check for expiring items and send notifications
const checkExpiringItems = async () => {
  try {
    const users = await User.find();
    
    for (const user of users) {
      // Find items expiring in the next 3 days
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      const expiringItems = await Item.find({
        user_id: user._id,
        expiry_date: {
          $gte: new Date(),
          $lte: threeDaysFromNow
        }
      });

      if (expiringItems.length > 0) {
        await sendExpiryNotification(user.email, expiringItems);
      }
    }
  } catch (error) {
    console.error('Error checking expiring items:', error);
  }
};

// Check for expiring items every day at 9 AM
setInterval(checkExpiringItems, 24 * 60 * 60 * 1000);

// Initial check
checkExpiringItems();

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 