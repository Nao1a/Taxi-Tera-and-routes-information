const express = require('express');
const { getAllSubmissions, approveSubmission, rejectSubmission } = require('../controller/adminController');
const manage = require('../controller/adminManageController');
const isAuth = require('../middleware/authToken');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Admin-only submission management
router.get('/submissions', isAuth, isAdmin, getAllSubmissions);
router.patch('/submissions/:id/approve', isAuth, isAdmin, approveSubmission);
router.patch('/submissions/:id/reject', isAuth, isAdmin, rejectSubmission);

// Admin manage teras
router.get('/manage/teras', isAuth, isAdmin, manage.listTeras);
router.post('/manage/teras', isAuth, isAdmin, manage.createTera);
router.patch('/manage/teras/:id', isAuth, isAdmin, manage.updateTera);
router.delete('/manage/teras/:id', isAuth, isAdmin, manage.deleteTera);

// Admin manage routes
router.get('/manage/routes', isAuth, isAdmin, manage.listRoutes);
router.post('/manage/routes', isAuth, isAdmin, manage.createRoute);
router.patch('/manage/routes/:id', isAuth, isAdmin, manage.updateRoute);
router.delete('/manage/routes/:id', isAuth, isAdmin, manage.deleteRoute);

// Admin manage users (ban/unban submit)
router.get('/manage/users', isAuth, isAdmin, manage.listUsers);
router.post('/manage/users/:id/ban', isAuth, isAdmin, manage.banUser);
router.post('/manage/users/:id/unban', isAuth, isAdmin, manage.unbanUser);

module.exports = router;
