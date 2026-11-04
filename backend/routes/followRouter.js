const express = require('express');

const followController = require('../controller/followController');

const followRouter = express.Router();

followRouter.get('/follow/:authorId/status', followController.getFollowStatus);
followRouter.post('/follow/:authorId', followController.createFollow);
followRouter.post('/unFollow/:authorId', followController.deleteFollow);

module.exports = followRouter;