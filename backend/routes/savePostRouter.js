const express=require('express');

const savePostController=require('../controller/savePostController');
const { auth } = require('../middleware/authMiddleware');

const savePostRouter=express.Router();

savePostRouter.post('/save/post/:postId', auth, savePostController.savePost);
savePostRouter.delete('/delete/post/:postId', auth, savePostController.unsavePost);
savePostRouter.get('/savedPosts', auth, savePostController.getAllPosts);

module.exports = savePostRouter;