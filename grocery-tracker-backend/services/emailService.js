const nodemailer = require('nodemailer');

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS  // Your Gmail app password
  }
});

// Function to send expiry notification
const sendExpiryNotification = async (userEmail, items) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Grocery Items Expiring Soon',
      html: `
        <h2>Items Expiring Soon</h2>
        <p>The following items in your grocery tracker are expiring soon:</p>
        <ul>
          ${items.map(item => `
            <li>
              <strong>${item.name}</strong><br>
              Category: ${item.category}<br>
              Quantity: ${item.quantity}<br>
              Expiry Date: ${new Date(item.expiry_date).toLocaleDateString()}
            </li>
          `).join('')}
        </ul>
        <p>Please check your grocery tracker to manage these items.</p>
        <p>Best regards,<br>Grocery Tracker Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Expiry notification email sent successfully');
  } catch (error) {
    console.error('Error sending expiry notification email:', error);
    throw error;
  }
};

module.exports = {
  sendExpiryNotification
}; 