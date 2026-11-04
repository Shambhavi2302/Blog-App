const express = require('express');

const commentController = require('../controller/commentController');
const { auth } = require('../middleware/authMiddleware');

const commentRouter = express.Router();

commentRouter.post('/posts/:postId/comments', auth, commentController.createComment);
commentRouter.get('/posts/:postId/comments', commentController.getCommentsByPost);
commentRouter.get('/comments', auth, commentController.getAllComments);
// commentRouter.delete('/comments/:id', auth, commentController.deleteComment);
// commentRouter.patch('/comments/:id', auth, commentController.updateComment);
commentRouter.post('/comments/:id/like', auth, commentController.toggleLike);
commentRouter.get('/comments/getNumberOfCommentsByPost/:id',commentController.getNumberOfCommentsByPost);

module.exports = commentRouter;
