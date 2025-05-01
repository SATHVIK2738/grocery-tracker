import emailjs from '@emailjs/browser';

// TODO: Replace these with your actual EmailJS credentials
// 1. Go to https://www.emailjs.com/
// 2. Sign up and get your Public Key from Account > API Keys
// 3. Add an email service (Gmail, Outlook, etc.) from Email Services
// 4. Create email templates from Email Templates
// 5. Copy the Service ID and Template IDs

// Initialize EmailJS with your public key
emailjs.init("i6w-IIvTySHWXmkez");

const SERVICE_ID = 'service_s9nf8px';
const WELCOME_TEMPLATE_ID = 'template_hfj9c05';
const EXPIRY_TEMPLATE_ID = 'template_lw6gsuf';

// Function to send expiry notification
export const sendExpiryNotification = async (userEmail, items) => {
  try {
    const templateParams = {
      to_email: userEmail,
      to_name: userEmail.split('@')[0],
      subject: "Items Expiring Soon in Your Grocery List",
      expiring_items: items.map(item => 
        `${item.name} (Expires: ${new Date(item.expiry_date).toLocaleDateString()})`
      ).join('\n'),
      message: `You have ${items.length} items expiring soon in your grocery list.`,
      reply_to: userEmail,
    };

    await emailjs.send(
      SERVICE_ID,
      EXPIRY_TEMPLATE_ID,
      templateParams
    );

    console.log('Expiry notification email sent successfully');
  } catch (error) {
    console.error('Error sending expiry notification email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (userEmail, username) => {
  try {
    const templateParams = {
      to_email: userEmail,
      username: username,
      message: "Get started by adding your first grocery item!",
      reply_to: userEmail,
    };

    await emailjs.send(
      SERVICE_ID,
      WELCOME_TEMPLATE_ID,
      templateParams
    );

    console.log('Welcome email sent successfully');
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}; 