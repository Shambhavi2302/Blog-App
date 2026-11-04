const test = require('node:test');
const assert = require('node:assert/strict');

const postController = require('../controller/postController');
const Post = require('../models/postSchema');
const User = require('../models/userSchema');
const SavePost = require('../models/savePostSchema');

test('getPosts should work for unauthenticated users without saving state', async () => {
  const originalUserFind = User.find;
  const originalPostCountDocuments = Post.countDocuments;
  const originalPostFind = Post.find;
  const originalSaveFind = SavePost.find;

  try {
    User.find = async () => [];
    Post.countDocuments = async () => 1;
    Post.find = () => ({
      populate: () => ({
        populate: () => ({
          sort: () => ({
            skip: () => ({
              limit: async () => [
                {
                  _id: '64a000000000000000000001',
                  title: 'Hello',
                  content: 'Example content',
                  status: 'Published',
                  author: { _id: '64a000000000000000000002', name: 'Alice' },
                  category: { _id: '64a000000000000000000003', name: 'News' },
                  toObject: () => ({
                    _id: '64a000000000000000000001',
                    title: 'Hello',
                    content: 'Example content',
                    status: 'Published',
                    author: { _id: '64a000000000000000000002', name: 'Alice' },
                    category: { _id: '64a000000000000000000003', name: 'News' },
                  }),
                },
              ],
            }),
          }),
        }),
      }),
    });
    SavePost.find = async () => [];

    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };

    await postController.getPosts(
      {
        query: {
          page: '1',
          limit: '7',
          search: '',
          status: 'Published',
        },
        user: null,
      },
      res
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data[0].isSaved, false);
  } finally {
    User.find = originalUserFind;
    Post.countDocuments = originalPostCountDocuments;
    Post.find = originalPostFind;
    SavePost.find = originalSaveFind;
  }
});
