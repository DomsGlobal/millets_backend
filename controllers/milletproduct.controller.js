const express = require('express');
const { Product } = require('../models/milletproducts.model');

const createProduct = (req, res) => {
  const { name, description, stars, price, discount } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'Image is required.' });
  }

  if (!name || !description || !stars || !price || !discount) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const imagePath = `uploads/${req.file.filename}`;

  const newProduct = { name, description, image: imagePath, stars, price, discount };

  Product.create(newProduct, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error creating product.', error: err });
    }
    res.status(201).json({ message: 'Product created successfully.', productId: result.insertId });
  });
};

const getAllProducts = (req, res) => {
  Product.find((err, products) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching products.', error: err });
    }
    res.status(200).json({ products });
  });
};
 
const getProductById = (req, res) => {
  const { id } = req.params;

  Product.findById(id, (err, product) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching product.', error: err });
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.status(200).json({ product });
  });
};

const deleteAllProducts = (req, res) => {
  Product.deleteAll((err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error deleting all products.', error: err });
    }
    res.status(200).json({ message: 'All products deleted successfully.' });
  });
};

const deleteProductById = (req, res) => {
  const { id } = req.params;
  Product.deleteById(id, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error deleting product.', error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.status(200).json({ message: 'Product deleted successfully.' });
  });
};

const updateProductById = (req, res) => {
  const { id } = req.params;
 
  const { name, description, stars, price, discount } = req.body;
 
  const image = req.file ? `uploads/${req.file.filename}` : null;
 
  Product.findById(id, (err, existingProduct) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching product.', error: err });
    }
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found.' });
    }
 
    const updatedData = {
      name: name || existingProduct.name,
      description: description || existingProduct.description,
      stars: stars || existingProduct.stars,
      price: price || existingProduct.price,
      discount: discount || existingProduct.discount,
      image: image || existingProduct.image,
    };
 
    Product.updateById(id, updatedData, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error updating product.', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Product not found.' });
      }
      res.status(200).json({ message: 'Product updated successfully.' });
    });
  });
};



module.exports = { createProduct, getAllProducts, getProductById, deleteAllProducts, deleteProductById, updateProductById};