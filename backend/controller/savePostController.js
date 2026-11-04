const SavePost = require("../models/savePostSchema");
const Post = require("../models/postSchema");

const getCurrentUserId = (req) => {
  if (!req || !req.user) return null;
  return req.user.userId || req.user.id || null;
};

const getPostIdFromRequest = (req) => {
  if (!req) return null;
  return req.params?.postId || req.body?.postId || req.query?.postId || null;
};

exports.savePost = async (req, res) => {
  try {
    const postId = getPostIdFromRequest(req);
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Login required" });
    }

    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    const saved = await SavePost.create({
      savedPost: postId,
      user: userId,
    });

    res.status(201).json(saved);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Post already saved",
      });
    }

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.unsavePost = async (req, res) => {
  try {
    const postId = getPostIdFromRequest(req);
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Login required" });
    }

    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    await SavePost.findOneAndDelete({
      savedPost: postId,
      user: userId,
    });

    res.status(200).json({
      message: "Post removed from saved",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Login required" });
    }

    const savedPosts = await SavePost.find({ user: userId })
      .populate({
        path: "savedPost",
        populate: {
          path: "author",
          select: "name email role",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: savedPosts.map((item) => item.savedPost),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
