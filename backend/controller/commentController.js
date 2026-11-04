const Comment = require("../models/commentSchema");
const Post = require("../models/postSchema");

exports.createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;

        if (!req.user || !(req.user.userId || req.user.id)) {
            return res.status(401).json({
                success: false,
                message: "Login required to comment",
            });
        }

        if (!postId || !content || !String(content).trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment content is required",
            });
        }

        const postExists = await Post.findById(postId);
        if (!postExists) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        const userId = req.user.userId || req.user.id;
        const user = await require('../models/userSchema').findById(userId).select('name email');

        const commentData = {
            post: postId,
            name: user?.name || 'User',
            email: user?.email || 'unknown@example.com',
            content: String(content).trim(),
            authorUser: userId,
        };

        const comment = await Comment.create(commentData);

        return res.status(201).json({
            success: true,
            data: comment,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


exports.getNumberOfCommentsByPost = async (req, res) => {
    try {
        const postId = req.params.postId || req.params.id;
        const mongoose = require('mongoose');

        if (!postId) {
            return res.status(400).json({ success: false, message: 'postId required' });
        }

        let targetPostId = postId;

        // if it looks like an ObjectId try counting; if zero, fallback to resolving slug
        if (mongoose.Types.ObjectId.isValid(postId)) {
            const countAttempt = await Comment.countDocuments({ post: postId });
            if (countAttempt > 0) {
                return res.status(200).json({ success: true, count: countAttempt });
            }
            // fallback: maybe param was a slug that happens to be ObjectId-like
            const postBySlug = await Post.findOne({ slug: postId });
            if (postBySlug) {
                targetPostId = postBySlug._id;
            }
        } else {
            const post = await Post.findOne({ slug: postId });
            if (!post) {
                return res.status(404).json({ success: false, message: 'Post not found' });
            }
            targetPostId = post._id;
        }

        const count = await Comment.countDocuments({ post: targetPostId });

        return res.status(200).json({ success: true, count });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
}

exports.getCommentsByPost = async (req, res) => {
    try {
        const { postId } = req.params;

        let targetPostId = postId;

        // If the provided param is not a valid ObjectId, try to resolve as slug
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            const post = await Post.findOne({ slug: postId });
            if (!post) {
                return res.status(404).json({ success: false, message: 'Post not found' });
            }
            targetPostId = post._id;
        }

        const comments = await Comment.find({ post: targetPostId })
            .populate('authorUser', 'name email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: comments,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getAllComments = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "Author") {
            return res.status(403).json({
                success: false,
                message: "Author access required",
            });
        }

        const comments = await Comment.find().populate("post", "title slug").sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: comments,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.toggleLike = async (req, res) => {
    try {
        if (!req.user || !(req.user.userId || req.user.id)) {
            return res.status(401).json({ success: false, message: 'Login required to like comments' });
        }

        const { id } = req.params;
        const comment = await Comment.findById(id);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

        const currentUserId = req.user.userId || req.user.id;
        const likedBy = comment.likedBy || [];
        const explicitState = typeof req.body?.liked === 'boolean' ? req.body.liked : null;

        const alreadyLiked = likedBy.some(u => String(u) === String(currentUserId));
        const nextLikedState = explicitState !== null ? explicitState : !alreadyLiked;

        if (nextLikedState && !alreadyLiked) {
            likedBy.push(currentUserId);
            comment.likes = (comment.likes || 0) + 1;
        } else if (!nextLikedState && alreadyLiked) {
            const idx = likedBy.findIndex(u => String(u) === String(currentUserId));
            likedBy.splice(idx, 1);
            comment.likes = Math.max(0, (comment.likes || 0) - 1);
        }

        comment.likedBy = likedBy;
        await comment.save();

        return res.status(200).json({ success: true, data: { likes: comment.likes, likedBy: comment.likedBy } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

