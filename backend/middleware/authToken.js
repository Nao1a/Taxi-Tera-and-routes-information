const asyncHandler = require("express-async-handler")
const jwt = require("jsonwebtoken")


const validateToken = asyncHandler(async(req, res, next) => {
    let token;
    
    

    let authHeader = req.headers.Authorization || req.headers.authorization;
    let bearerToken;
    if (authHeader && authHeader.startsWith("Bearer")) {
        bearerToken = authHeader.split(" ")[1] || req.cookies?.token;
    }
    token = bearerToken;
    if (!token) { 
        res.status(401);
        throw new Error("User is not authorized or token is missing");
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            res.status(401);
            throw new Error("User is not authorized");
        }
        req.user = decoded.user;
        next();
    });
})

module.exports = validateToken;