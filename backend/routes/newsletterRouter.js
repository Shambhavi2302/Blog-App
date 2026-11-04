const express = require('express');
const { subscribeToNewsletter } = require('../controller/newsletterController');

const newsletterRouter = express.Router();

newsletterRouter.post('/newsletter/subscribe', subscribeToNewsletter);

module.exports = newsletterRouter;
