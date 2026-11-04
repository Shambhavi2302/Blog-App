const express = require('express');

const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} = require('../controller/categoryController');

const { auth } = require('../middleware/authMiddleware');

const categoryRouter = express.Router();

categoryRouter.post('/categories',auth, createCategory);
categoryRouter.get('/categories', getCategories);
categoryRouter.get('/categories/:id', getCategoryById);
categoryRouter.put('/categories/:id',auth, updateCategory);
categoryRouter.delete('/categories/:id',auth, deleteCategory);

module.exports = categoryRouter;
