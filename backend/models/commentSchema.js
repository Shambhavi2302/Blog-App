const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        },

        name: String,

        email: String,

        content: String,

        authorUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },

        likes: {
            type: Number,
            default: 0,
        },

        likedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ],
    },
    {
        timestamps: true
    });

module.exports = mongoose.model("Comment", commentSchema);