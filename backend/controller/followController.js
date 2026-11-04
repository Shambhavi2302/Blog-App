const Follow = require("../models/followSchema");

exports.getFollowStatus = async (req, res) => {
    try {
        const authorId = req.params.authorId;
        const followerId = req.user?.userId || req.user?.id || req.query?.followerId || req.body?.followerId || req.body?.userId;

        if (!authorId || !followerId) {
            return res.status(400).json({
                success: false,
                message: "Author and follower ids are required",
            });
        }

        const follow = await Follow.findOne({ follower: followerId, following: authorId });

        return res.status(200).json({
            success: true,
            following: !!follow,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.createFollow = async (req, res) => {
    try {
        const authorId = req.params.authorId;
        const followerId = req.user?.userId || req.user?.id || req.body?.followerId || req.body?.userId;

        if (!followerId) {
            return res.status(400).json({
                success: false,
                message: "Follower id is required",
            });
        }

        if (!authorId || String(authorId) === String(followerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid author id",
            });
        }

        const existing = await Follow.findOne({ follower: followerId, following: authorId });
        if (existing) {
            await Follow.deleteOne({ _id: existing._id });
            return res.status(200).json({
                success: true,
                data: existing,
                following: false,
                message: "Follow removed",
            });
        }

        const follow = await Follow.create({
            following: authorId,
            follower: followerId,
        });

        return res.status(201).json({
            success: true,
            data: follow,
            following: true,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.deleteFollow = async (req, res) => {
    try {
        const authorId = req.params.authorId;
        const followerId = req.user?.userId || req.user?.id || req.body?.followerId || req.body?.userId;

        await Follow.findOneAndDelete({
            follower: followerId,
            following: authorId,
        });

        return res.status(200).json({
            success: true,
            message: "Follower deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}