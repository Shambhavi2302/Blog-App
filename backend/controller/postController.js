const Post = require("../models/postSchema");
const User = require("../models/userSchema");
const Category = require("../models/categorySchema");
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier");
const SavePost = require("../models/savePostSchema");
const mongoose = require("mongoose");

exports.createPost = async (req, res) => {
    try {
        const { title, content, category, status, coverImage } = req.body;
        const safeStatus = normalizePostStatus(status);
        let coverImageUrl = coverImage;

        // determine slug: prefer provided slug, otherwise derive from title
        let slugVal = req.body.slug ? String(req.body.slug).trim() : buildSlug(title || '');
        if (slugVal === '') slugVal = null;

        // if there's a slug, make sure it's unique
        if (slugVal) {
            const base = slugVal;
            let counter = 1;
            // loop until we find a unique slug
            while (await Post.findOne({ slug: slugVal })) {
                slugVal = `${base}-${counter++}`;
            }
        }

        if (req.file && req.file.buffer) {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'cms_app/posts', resource_type: 'image' },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
            });
            coverImageUrl = result.secure_url;
        }

        const post = await Post.create({
            title,
            content,
            slug: slugVal,
            coverImage: coverImageUrl,
            author: (req.user && (req.user.userId || req.user.id)) || null,
            status: safeStatus,
            category,
        });

        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const buildSlug = (title = "") => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
};

const generateUniqueSlug = async (title, excludeId = null) => {
    const baseSlug = buildSlug(title || "");

    if (!baseSlug) return null;

    let candidate = baseSlug;
    let counter = 1;

    while (await Post.findOne({ slug: candidate, _id: { $ne: excludeId } })) {
        candidate = `${baseSlug}-${counter++}`;
    }

    return candidate;
};

const normalizePostStatus = (value) => {
    const nextValue = typeof value === "string" ? value.trim() : "";
    const lowerValue = nextValue.toLowerCase();

    if (lowerValue === "draft") return "Draft";
    if (lowerValue === "published") return "Published";
    if (lowerValue === "all") return "All";

    return "Published";
};

const canManagePost = (req, post) => {
    if (!req.user) return false;
    if (req.user.role === "Author") return true;

    const currentUserId = req.user.userId || req.user.id;
    if (!currentUserId) return false;

    return String(post.author?._id || post.author) === String(currentUserId);
};

const cleanupEmptyCategory = async (categoryId) => {
    if (!categoryId) return;

    const existingPosts = await Post.exists({ category: categoryId });

    if (!existingPosts) {
        await Category.findByIdAndDelete(categoryId);
    }
};

exports.getPosts = async (req, res) => {
    try {
        const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
        const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
        const search = (req.query.search || "").trim();
        const category = req.query.category || "";
        const rawAuthor = (req.query.author || "").trim();
        const statusFilter = normalizePostStatus(req.query.status || "Published");

        const query = {};

        if (statusFilter !== "All") {
            query.status = statusFilter || "Published";
        }

        if (search) {
            const matchingAuthorIds = await User.find({
                name: { $regex: search, $options: "i" },
            }).select("_id").lean();

            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { content: { $regex: search, $options: "i" } },
            ];

            if (matchingAuthorIds.length) {
                query.$or.push({
                    author: { $in: matchingAuthorIds.map((user) => user._id) },
                });
            }
        }

        if (category) {
            if (mongoose.Types.ObjectId.isValid(category)) {
                query.category = category;
            }
        }

        if (rawAuthor) {
            if (mongoose.Types.ObjectId.isValid(rawAuthor)) {
                query.author = rawAuthor;
            } else {
                const matchingAuthors = await User.find({
                    name: { $regex: rawAuthor, $options: "i" },
                }).select("_id").lean();

                if (matchingAuthors.length) {
                    query.author = {
                        $in: matchingAuthors.map((user) => user._id),
                    };
                } else {
                    query.author = null;
                }
            }
        }

        const totalPosts = await Post.countDocuments(query);

        const posts = await Post.find(query)
            .populate("author", "name email role")
            .populate("category", "name slug")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Get saved posts of current user
        const currentUserId = req.user && (req.user.userId || req.user.id);
        const savedPostIds = new Set();

        if (currentUserId) {
            const savedPosts = await SavePost.find({
                user: currentUserId,
            }).select("savedPost");

            savedPosts.forEach((item) => {
                savedPostIds.add(item.savedPost.toString());
            });
        }

        // Add isSaved field to each post
        const postsWithSaveStatus = posts.map((post) => ({
            ...post.toObject(),
            isSaved: savedPostIds.has(post._id.toString()),
        }));

        return res.status(200).json({
            success: true,
            page,
            limit,
            totalPosts,
            totalPages: Math.ceil(totalPosts / limit) || 1,
            data: postsWithSaveStatus,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getPostBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        let post = null;

        // If the param is a valid ObjectId, try finding by id first
        if (mongoose.Types.ObjectId.isValid(slug)) {
            post = await Post.findById(slug)
                .populate("author", "name email role")
                .populate("category", "name slug");
        }

        // Fallback to slug lookup
        if (!post) {
            post = await Post.findOne({ slug })
                .populate("author", "name email role")
                .populate("category", "name slug");
        }

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: post,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.togglePostLike = async (req, res) => {
    try {
        if (!req.user || !(req.user.userId || req.user.id)) {
            return res.status(401).json({ success: false, message: 'Login required to like posts' });
        }

        const { id } = req.params;
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        const currentUserId = req.user.userId || req.user.id;
        const likedBy = post.likedBy || [];
        const explicitState = typeof req.body?.liked === 'boolean' ? req.body.liked : null;
        const alreadyLiked = likedBy.some((userId) => String(userId) === String(currentUserId));
        const nextLikedState = explicitState !== null ? explicitState : !alreadyLiked;

        if (nextLikedState && !alreadyLiked) {
            likedBy.push(currentUserId);
            post.likes = (post.likes || 0) + 1;
        } else if (!nextLikedState && alreadyLiked) {
            const index = likedBy.findIndex((userId) => String(userId) === String(currentUserId));
            likedBy.splice(index, 1);
            post.likes = Math.max(0, (post.likes || 0) - 1);
        }

        post.likedBy = likedBy;
        await post.save();

        return res.status(200).json({
            success: true,
            data: { likes: post.likes, likedBy: post.likedBy },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, status, coverImage } = req.body;
        const safeStatus = status ? normalizePostStatus(status) : null;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        if (!canManagePost(req, post)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this post",
            });
        }

        const previousCategoryId = post.category;
        const updatedData = {};

        if (typeof title !== 'undefined') {
            updatedData.title = title;
        }

        if (typeof content !== 'undefined') {
            updatedData.content = content;
        }

        if (typeof category !== 'undefined') {
            updatedData.category = category;
        }

        if (safeStatus) {
            updatedData.status = safeStatus;
        }

        if (req.file && req.file.buffer) {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'cms_app/posts', resource_type: 'image' },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
            });
            updatedData.coverImage = result.secure_url;
        } else if (typeof coverImage !== 'undefined') {
            updatedData.coverImage = coverImage;
        }

        if (typeof title === 'string' && title.trim()) {
            const nextSlug = await generateUniqueSlug(title, id);
            if (nextSlug) {
                updatedData.slug = nextSlug;
            }
        }

        const updatedPost = await Post.findByIdAndUpdate(id, updatedData, {
            new: true,
            runValidators: true,
        });

        if (previousCategoryId && category && String(previousCategoryId) !== String(category)) {
            await cleanupEmptyCategory(previousCategoryId);
        }

        return res.status(200).json({
            success: true,
            data: updatedPost,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        if (!canManagePost(req, post)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this post",
            });
        }

        const categoryId = post.category;
        await Post.findByIdAndDelete(id);

        if (categoryId) {
            await cleanupEmptyCategory(categoryId);
        }

        return res.status(200).json({
            success: true,
            message: "Post deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

