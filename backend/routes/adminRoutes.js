const express = require('express');
const { getAllSubmissions, approveSubmission, rejectSubmission } = require('../controller/adminController');
const manage = require('../controller/adminManageController');
const driverController = require('../controller/adminDriverController');
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

// Admin manage users (ban/unban submit, account ban, role)
router.get('/manage/users', isAuth, isAdmin, manage.listUsers);
router.post('/manage/users/:id/ban', isAuth, isAdmin, manage.banUser);
router.post('/manage/users/:id/unban', isAuth, isAdmin, manage.unbanUser);
router.post('/manage/users/:id/ban-account', isAuth, isAdmin, manage.banAccount);
router.post('/manage/users/:id/unban-account', isAuth, isAdmin, manage.unbanAccount);
router.patch('/manage/users/:id/role', isAuth, isAdmin, manage.changeUserRole);

// KYC Management
router.get('/manage/kyc-pending', isAuth, isAdmin, manage.listPendingKYC);
router.post('/manage/kyc/:id/approve', isAuth, isAdmin, manage.approveKYC);
router.post('/manage/kyc/:id/reject', isAuth, isAdmin, manage.rejectKYC);

// Car Approvals (Libre)
router.get('/manage/cars-pending', isAuth, isAdmin, manage.listPendingCars);
router.post('/manage/cars/:id/approve', isAuth, isAdmin, manage.approveCar);
router.post('/manage/cars/:id/reject', isAuth, isAdmin, manage.rejectCar);

// Admin driver management
router.get('/drivers', isAuth, isAdmin, driverController.listDrivers);
router.post('/drivers/:id/verify', isAuth, isAdmin, driverController.verifyDriver);
router.post('/drivers/:id/reject-verification', isAuth, isAdmin, driverController.rejectDriverVerification);
router.post('/drivers/:id/ban-from-route', isAuth, isAdmin, driverController.banFromRoute);
router.post('/drivers/:id/unban-from-route', isAuth, isAdmin, driverController.unbanFromRoute);
router.post('/drivers/:id/force-remove-route', isAuth, isAdmin, driverController.forceRemoveFromRoute);
router.post('/drivers/:id/assign-route', isAuth, isAdmin, driverController.assignRoute);

// Analytics
router.get('/analytics', isAuth, isAdmin, manage.getAnalytics);

module.exports = router;
