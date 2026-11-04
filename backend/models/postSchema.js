const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        title: String,

        slug: {
            type: String,
            unique: true
        },

        content: String,

        coverImage: String,

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category"
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

        status: {
            type: String,
            enum: ["Draft", "Published"],
            default: "Draft"
        }
    },
    {
        timestamps: true
    });

module.exports = mongoose.model("Post", postSchema);