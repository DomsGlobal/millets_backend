const sendEmail = require('../services/emailService');

const sendAppointmentNotificationEmail = async (req, res) => { 
  const { 
    userName, 
    userPhone, 
    userEmail, 
    serviceName, 
    adminName = "Admin",   
    adminEmail = "Milletioglobalgrain@gmail.com" 
  } = req.body;
 
  const emailData = {
    to: adminEmail, 
    subject: 'New Appointment Notification',
    body: `
      <h1>New Appointment Notification</h1>
      <p>Dear ${adminName},</p>
      <p>You have a new appointment! Here are the details:</p>
      <p><strong>User Details:</strong></p>
      <ul>
        <li>Name: ${userName}</li>
        <li>Phone Number: ${userPhone}</li>
        <li>Email: ${userEmail}</li>
      </ul>
      <p><strong>Service Details:</strong></p>
      <p>Service Booked: ${serviceName}</p>
      <p>Please log in to the admin portal to view and manage the booking.</p>
      <p>Thank you,</p> 
    `,
  };

  try {
    console.log('Sending appointment notification email...');
    await sendEmail(emailData);
    console.log('Appointment email sent successfully');
    res.status(200).json({ message: 'Appointment notification email sent successfully.' });
  } catch (error) {
    console.error('Error sending appointment email:', error);
    res.status(500).json({ message: 'Failed to send appointment notification email.' });
  }
};

module.exports = { sendAppointmentNotificationEmail };
