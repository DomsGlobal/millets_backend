const { MilletContact } = require('../models/milletcontact.model');

// Create a new contact
const createContact = (req, res) => {
  const { name, email, phone_number, message } = req.body;

  if (!name || !email || !phone_number) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  MilletContact.create({ name, email, phone_number, message }, (err, result) => {
    if (err) {
      console.error('Error creating contact:', err);
      return res.status(500).json({ message: 'Error creating contact.', error: err });
    }
    res.status(201).json({
      message: 'Contact created successfully.',
      contactId: result.insertId,
    });
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
