const express = require('express');
const router = express.Router();
const validateToken = require('../middleware/authToken');
const { 
  getAvailableJobs,
  applyForJob,
  makeOffer,
  getMyApplications,
  getChatMessages,
  sendMessage,
  getUnreadMessageCount
} = require('../controller/hireController');

router.use(validateToken);

router.get('/jobs', getAvailableJobs);
router.post('/apply', applyForJob);
router.get('/unread-count', getUnreadMessageCount);
router.post('/requests/:id/offer', makeOffer);
router.get('/my-applications', getMyApplications);
router.get('/requests/:id/messages', getChatMessages);
router.post('/requests/:id/messages', sendMessage);

module.exports = router;