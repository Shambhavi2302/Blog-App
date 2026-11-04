const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || "";
  const cookieToken = req.cookies?.token;

  if (cookieToken) {
    return cookieToken;
  }

  return authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
};

const verifyToken = (token) => {
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error("JWT secret not configured");
  }

  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (error) {
    if (JWT_SECRET && JWT_SECRET !== ACCESS_TOKEN_SECRET) {
      return jwt.verify(token, JWT_SECRET);
    }
    throw error;
  }
};

exports.auth = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token missing",
    });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }
};

exports.optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      req.user = null;
      return next();
    }

    req.user = verifyToken(token);
    return next();
  } catch (error) {
    req.user = null;
    return next();
  }
};

exports.verifyRefreshToken = (token) => {
  if (!REFRESH_TOKEN_SECRET) {
    throw new Error("Refresh token secret not configured");
  }

  return jwt.verify(token, REFRESH_TOKEN_SECRET);
};