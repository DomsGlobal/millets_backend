const { MilletContact } = require('../models/milletcontact.model');
const nodemailer = require('nodemailer');

const sendEmail = async (emailData) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, 
      },
    });
    
    console.log("Transporter configured successfully");
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.body,
    };
    
    console.log("Sending email to:", emailData.to);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log("Email sent successfully:", info.response);
    return { success: true, message: "Email sent successfully", info };
  } catch (error) {
    console.error('Error in sendEmail:', error.message);
    return { success: false, message: "Failed to send email", error: error.message };
  }
};

// Create a new contact
const createContact = (req, res) => {
  const { name, email, phone_number, message } = req.body;

  if (!name || !email || !phone_number) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  MilletContact.create({ name, email, phone_number, message }, async (err, result) => {
    if (err) {
      console.error('Error creating contact:', err);
      return res.status(500).json({ message: 'Error creating contact.', error: err });
    }

    const emailContent = `
      <h1>New Contact Created</h1>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Phone:</strong> ${phone_number}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong> ${message}</p>
    `;

    const emailData = {
      to: "Milletioglobalgrain@gmail.com",
      subject: "New Contact Entry",
      body: emailContent,
    };

    try {
      const emailResponse = await sendEmail(emailData);
      if (emailResponse.success) {
        return res.status(201).json({
          message: 'Contact created successfully and email sent.',
          contactId: result.insertId,
          emailInfo: emailResponse.info,
        });
      } else {
        return res.status(201).json({
          message: 'Contact created successfully, but email failed to send.',
          contactId: result.insertId,
          emailError: emailResponse.error,
        });
      }
    } catch (error) {
      return res.status(201).json({
        message: 'Contact created successfully, but email encountered an error.',
        contactId: result.insertId,
        emailError: error.message,
      });
    }
  });
};

// Get all contacts
const getAllContacts = (req, res) => {
  MilletContact.getAll((err, results) => {
    if (err) {
      console.error('Error fetching contacts:', err);
      return res.status(500).json({ message: 'Error fetching contacts.', error: err });
    }
    res.status(200).json(results);
  });
};

// Get contact by ID
const getContactById = (req, res) => {
  const { id } = req.params;

  MilletContact.getById(id, (err, results) => {
    if (err) {
      console.error('Error fetching contact by ID:', err);
      return res.status(500).json({ message: 'Error fetching contact by ID.', error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Contact not found.' });
    }

    res.status(200).json(results[0]);
  });
};

// Delete contact by ID
const deleteContactById = (req, res) => {
  const { id } = req.params;

  MilletContact.deleteById(id, (err) => {
    if (err) {
      console.error('Error deleting contact by ID:', err);
      return res.status(500).json({ message: 'Error deleting contact by ID.', error: err });
    }
    res.status(200).json({ message: 'Contact deleted successfully.' });
  });
};

// Delete all contacts
const deleteAllContacts = (req, res) => {
  MilletContact.deleteAll((err) => {
    if (err) {
      console.error('Error deleting all contacts:', err);
      return res.status(500).json({ message: 'Error deleting all contacts.', error: err });
    }
    res.status(200).json({ message: 'All contacts deleted successfully.' });
  });
};

module.exports = { createContact, getAllContacts, getContactById, deleteContactById, deleteAllContacts, };
