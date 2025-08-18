const asyncHandler = require('express-async-handler');
const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const transporter = require('../config/mailer');




const SignupUser = asyncHandler(async (req, res) => {
    const {username , email , password } = req.body;
    if(!username || !email || !password) {
        res.status(400);
        throw new Error("Please fill in all fields");
    }
    if (typeof password !== 'string' || password.length < 8) {
        res.status(400);
        throw new Error("Password must be at least 8 characters");
    }
    const usernameAvailable = await User.findOne({ username });
    if (usernameAvailable) {
        res.status(400);
        throw new Error("Username is already taken");
    }
    const emailExists = await User.findOne({ email });
    if (emailExists) {
        res.status(400);
        throw new Error("Email is already in use");
    }

    const hashedPassword = await bcrypt.hash(password, 10);



    const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        isVerified: false
    });
    console.log("user created" , newUser);
    // Send verification email
    try {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationToken = jwt.sign({ email: newUser.email, code: verificationCode }, process.env.JWT_SECRET, { expiresIn: '10m' });
        const frontendBase = process.env.FRONTEND_BASE_URL || `${req.protocol}://${req.get('host').replace(/\/$/, '')}`;
        const verifyUrl = `${frontendBase}/verify-email?token=${verificationToken}&code=${verificationCode}`;
        console.log(`verification token: ${verificationToken}`);
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'no-reply@example.com',
            to: newUser.email,
            subject: 'Verify your email',
            html: `<p>Hi ${newUser.username},</p><p>Your verification code is: <b>${verificationCode}</b></p><p>Or click <a href="${verifyUrl}">here</a> to verify.</p>`
        });
        return res.status(201).json({
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            message: 'Signup successful, verification email sent',
            verifyToken: verificationToken
        });
    } catch (mailErr) {
        console.error('Email send failed:', mailErr.message);
        return res.status(201).json({
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            message: 'Signup successful but failed to send verification email'
        });
    }
    
})

const loginUser = asyncHandler(async (req, res) => {
    const {username , password} = req.body;
    if (!username || !password) {
        res.status(400);
        throw new Error("Please fill in all fields");
    }

    const user = await User.findOne({username})

    if (!user || !(await bcrypt.compare(password , user.password))) {
        res.status(401);
        throw new Error("Invalid username or password");
    }
    if (!user.isVerified) {
        // Send (or re-send) verification email & provide token so client can direct user
        try {
            const token = await sendVerificationEmail(user, req);
            return res.status(403).json({
                needsVerification: true,
                email: user.email,
                message: 'Email not verified. Verification email sent.',
                verifyToken: token
            });
        } catch (e) {
            return res.status(403).json({
                needsVerification: true,
                email: user.email,
                message: 'Email not verified. Failed to send verification email, try resending.',
            });
        }
    }
    const accessToken = jwt.sign({
        user: { username: user.username, id: user.id, role: user.role }
    }, process.env.JWT_SECRET, { expiresIn: '166h' });
    res.status(200).json({ accessToken, username: user.username, email: user.email, role: user.role });
})

const currentUser = asyncHandler(async (req, res) => {
    // req.user is set by authentication middleware
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    res.json({ user: req.user });
});



const verifyEmail = asyncHandler(async (req, res) => {
    const { code } = req.query;
    // req.user is set by verifyToken middleware
    if (!code) {
        return res.status(400).json({ message: 'Verification code is required.' });
    }
    try {
        // Find user by email from decoded token (set in req.user)
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(400).json({ message: 'User not found.' });
        }
        // Compare code from query with code from token (req.user.code)
        if (req.user.code !== code) {
            return res.status(400).json({ message: 'Invalid verification code.' });
        }
        user.isVerified = true;
        await user.save();
        return res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (err) {
        return res.status(400).json({ message: 'Verification failed.' });
    }
});

// Utility function to send verification email and return JWT token
async function sendVerificationEmail(user, req) {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = jwt.sign({ email: user.email, code: verificationCode }, process.env.JWT_SECRET, { expiresIn: '10m' });
    // Include both token and code in the URL and direct users to the frontend Verify page
    const frontendBase = process.env.FRONTEND_BASE_URL || `${req.protocol}://${req.get('host').replace(/\/$/, '')}`;
    const verifyUrl = `${frontendBase}/verify-email?token=${verificationToken}&code=${verificationCode}`;
    await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'no-reply@example.com',
        to: user.email,
        subject: 'Verify your email',
        html: `<p>Hi ${user.username || 'there'},</p><p>Your verification code is: <b>${verificationCode}</b></p><p>Or click <a href="${verifyUrl}">here</a> to verify.</p>`
    });

    return verificationToken;
}

// Route handler to send verification email and return JWT token
const requestVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: 'User not found.' });
    }
    if (user.isVerified) {
        return res.status(400).json({ message: 'User is already verified.' });
    }
    const token = await sendVerificationEmail(user, req);
    res.json({ message: 'Verification email sent. Please check your inbox.', verifyToken: token });
});

// Stateless logout (client just discards token). Provided for symmetry/future blacklist.
const logoutUser = asyncHandler(async (req, res) => {
    return res.json({ message: 'Logged out (client token invalidated client-side).' });
});

// Delete current authenticated user after confirming password
const deleteCurrentUser = asyncHandler(async (req, res) => {
    const { password } = req.body;
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!password) {
        return res.status(400).json({ message: 'Password required.' });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(401).json({ message: 'Incorrect password.' });
    }
    await user.deleteOne();
    return res.json({ message: 'Account deleted.' });
});


module.exports = {
    SignupUser,
    loginUser,
    currentUser,
    verifyEmail,
    requestVerificationEmail,
    logoutUser,
    deleteCurrentUser
};