const express = require('express');
const { SignupUser, loginUser ,currentUser, verifyEmail, requestVerificationEmail, logoutUser, deleteCurrentUser } = require('../controller/userController');
const verifyTokenMiddleware = require('../middleware/verifyTokenMiddleware');
const authToken = require('../middleware/authToken')

const router = express.Router();


router.post("/signup" , SignupUser)
router.post("/login" , loginUser)
router.get("/current", authToken ,currentUser)
router.get("/verify-email",verifyTokenMiddleware, verifyEmail)
router.post("/request-verification-email", requestVerificationEmail)
router.post('/logout', authToken, logoutUser)
router.delete('/delete', authToken, deleteCurrentUser)

module.exports = router;