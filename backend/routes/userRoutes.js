const express = require('express');
const { SignupUser, loginUser ,currentUser, verifyEmail, requestVerificationEmail, logoutUser, deleteCurrentUser, verifyDriver, verifyOwner } = require('../controller/userController');
const verifyTokenMiddleware = require('../middleware/verifyTokenMiddleware');
const authToken = require('../middleware/authToken');
const { uploadLicense, uploadIdentity } = require('../middleware/uploadMiddleware');

const router = express.Router();


router.post("/signup" , SignupUser)
router.post("/login" , loginUser)
router.get("/current", authToken ,currentUser)
router.get("/verify-email",verifyTokenMiddleware, verifyEmail)
router.post("/request-verification-email", requestVerificationEmail)
router.post('/logout', authToken, logoutUser)
router.delete('/delete', authToken, deleteCurrentUser)

// KYC Routes
router.post("/verify-driver", authToken, uploadLicense, verifyDriver);
router.post("/verify-owner", authToken, uploadIdentity, verifyOwner);

module.exports = router;