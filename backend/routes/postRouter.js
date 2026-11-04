const express = require('express');
const multer = require('multer');

const postController = require('../controller/postController');
const { auth, optionalAuth } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });
const postRouter = express.Router();

postRouter.post('/post', auth, upload.single('coverImage'), postController.createPost);
postRouter.get('/posts', optionalAuth, postController.getPosts);
postRouter.get('/posts/:slug', optionalAuth, postController.getPostBySlug);
postRouter.post('/posts/:id/like', auth, postController.togglePostLike);
postRouter.patch('/posts/:id', auth, upload.single('coverImage'), postController.updatePost);
postRouter.delete('/posts/:id', auth, postController.deletePost);

module.exports = postRouter;