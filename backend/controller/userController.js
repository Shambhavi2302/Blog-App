const User = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier");

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;

const createAccessToken = (user) => jwt.sign(
    {
        userId: user._id,
        email: user.email,
        role: user.role,
    },
    ACCESS_TOKEN_SECRET,
    {
        expiresIn: "15m",
    }
);

const createRefreshToken = (user) => jwt.sign(
    {
        userId: user._id,
        email: user.email,
        role: user.role,
    },
    REFRESH_TOKEN_SECRET,
    {
        expiresIn: "7d",
    }
);

exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token missing",
            });
        }

        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.userId).select("_id email role name image");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        const accessToken = createAccessToken(user);

        return res.status(200).json({
            success: true,
            accessToken,
            token: accessToken,
        });
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: "Invalid refresh token",
        });
    }
};

const resolveRole = (role) => {
    const value = String(role || '').trim();
    const normalized = value.toLowerCase();

    if (['reader', 'user', 'normal user', 'normal-user', 'member'].includes(normalized)) {
        return 'Reader';
    }

    if (['author', 'editor', 'admin'].includes(normalized)) {
        return 'Author';
    }

    return 'Reader';
};

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const requestedRole = resolveRole(role);

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: requestedRole,
        });

        res.status(201).json({
            success: true,
            message: `${user.role} registered successfully`,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
            return res.status(500).json({
                success: false,
                message: "JWT secret not configured",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const accessToken = createAccessToken(user);
        const refreshToken = createRefreshToken(user);

        res.cookie("token", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            token: accessToken,
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image || null,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getUsers = async (req, res) => {
    User.find()
        .then((data) => res.status(200).send(data))
        .catch((err) => res.status(400).send(err));
};

exports.updateUser = async (req, res) => {
    try {
        const { name, email } = req.body;
        const authenticatedUserId = req.user?.userId || req.user?._id || req.params?.id;

        let profileImageUrl = req.body.image && req.body.image !== 'null' ? req.body.image : null;

        if (!authenticatedUserId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const cleanName = String(name || '').trim();
        const cleanEmail = String(email || '').trim();

        if (req.file && req.file.buffer) {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'cms_app/users', resource_type: 'image' },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
            });
            profileImageUrl = result.secure_url;
        } else if (Object.prototype.hasOwnProperty.call(req.body, 'image') && (req.body.image === '' || req.body.image === 'null')) {
            profileImageUrl = null;
        }

        if (!cleanName || !cleanEmail) {
            return res.status(400).json({
                success: false,
                message: "Name & Email are required",
            });
        }

        const existingUser = await User.findOne({
            email: cleanEmail,
            _id: { $ne: authenticatedUserId },
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email is already in use",
            });
        }

        const updatePayload = {
            name: cleanName,
            email: cleanEmail,
        };

        if (req.file || Object.prototype.hasOwnProperty.call(req.body, 'image')) {
            updatePayload.image = profileImageUrl;
        }

        const user = await User.findByIdAndUpdate(
            authenticatedUserId,
            updatePayload,
            { new: true }
        ).select('_id name email role image');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image || null,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};