const express=require('express');
const multer = require('multer');

const userController=require('../controller/userController');
const { auth } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });
const userRouter=express.Router();

userRouter.post('/auth/register',userController.registerUser);
userRouter.post('/auth/login',userController.loginUser);
userRouter.post('/auth/refresh', userController.refreshToken);
userRouter.get('/users',userController.getUsers);
userRouter.patch('/updateUser', auth, upload.single('image'), userController.updateUser);

module.exports = userRouter;