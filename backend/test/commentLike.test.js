const test = require('node:test');
const assert = require('node:assert/strict');

const { toggleLike } = require('../controller/commentController');
const { togglePostLike } = require('../controller/postController');
const { createFollow } = require('../controller/followController');
const commentRouter = require('../routes/commentRouter');

function buildComment(initial = {}) {
  return {
    _id: 'comment-1',
    likes: 0,
    likedBy: [],
    ...initial,
    save() {
      return Promise.resolve(this);
    },
  };
}

const Comment = require('../models/commentSchema');
const originalFindById = Comment.findById;

test.beforeEach(() => {
  Comment.findById = async () => buildComment();
});

test.afterEach(() => {
  Comment.findById = originalFindById;
});

test('logged-in user can like once and toggle off', async () => {
  const comment = buildComment({ likedBy: [], likes: 0 });
  Comment.findById = async () => comment;

  let req = { params: { id: 'comment-1' }, user: { userId: 'user-1' }, body: { liked: true } };
  let res = { status(code) { this.statusCode = code; return this; }, json(payload) { this.payload = payload; return this; } };
  await toggleLike(req, res);
  assert.equal(comment.likes, 1);
  assert.deepEqual(comment.likedBy.map(String), ['user-1']);

  req = { params: { id: 'comment-1' }, user: { userId: 'user-1' }, body: { liked: false } };
  await toggleLike(req, res);
  assert.equal(comment.likes, 0);
  assert.deepEqual(comment.likedBy.map(String), []);
});

test('logged-in user does not get double-counted when toggling same state repeatedly', async () => {
  const comment = buildComment({ likedBy: ['user-1'], likes: 1 });
  Comment.findById = async () => comment;

  const req = { params: { id: 'comment-1' }, user: { userId: 'user-1' }, body: { liked: true } };
  const res = { status(code) { this.statusCode = code; return this; }, json(payload) { this.payload = payload; return this; } };

  await toggleLike(req, res);
  assert.equal(comment.likes, 1);
  assert.deepEqual(comment.likedBy.map(String), ['user-1']);
});

test('logged-in user can like a post once and toggle off', async () => {
  const Post = require('../models/postSchema');
  const post = {
    _id: 'post-1',
    likes: 0,
    likedBy: [],
    save() {
      return Promise.resolve(this);
    },
  };

  const originalFindById = Post.findById;
  Post.findById = async () => post;

  let req = { params: { id: 'post-1' }, user: { userId: 'user-1' }, body: { liked: true } };
  let res = { status(code) { this.statusCode = code; return this; }, json(payload) { this.payload = payload; return this; } };

  await togglePostLike(req, res);
  assert.equal(post.likes, 1);
  assert.deepEqual(post.likedBy.map(String), ['user-1']);

  req = { params: { id: 'post-1' }, user: { userId: 'user-1' }, body: { liked: false } };
  await togglePostLike(req, res);
  assert.equal(post.likes, 0);
  assert.deepEqual(post.likedBy.map(String), []);

  Post.findById = originalFindById;
});

test('follow can toggle on and off for the same user and author', async () => {
  const Follow = require('../models/followSchema');
  const originalFindOne = Follow.findOne;
  const originalDeleteOne = Follow.deleteOne;
  const originalCreate = Follow.create;

  try {
    let relation = null;
    Follow.findOne = async () => relation;
    Follow.deleteOne = async () => ({ deletedCount: 1 });
    Follow.create = async (payload) => {
      relation = { _id: 'follow-1', ...payload };
      return relation;
    };

    let req = { params: { authorId: 'author-1' }, body: { followerId: 'user-1' } };
    let res = { status(code) { this.statusCode = code; return this; }, json(payload) { this.payload = payload; return this; } };

    await createFollow(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.payload.data.following, 'author-1');
    assert.equal(res.payload.following, true);

    req = { params: { authorId: 'author-1' }, body: { followerId: 'user-1' } };
    res = { status(code) { this.statusCode = code; return this; }, json(payload) { this.payload = payload; return this; } };

    await createFollow(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.following, false);
  } finally {
    Follow.findOne = originalFindOne;
    Follow.deleteOne = originalDeleteOne;
    Follow.create = originalCreate;
  }
});

test('comment like route requires auth so anonymous users cannot increment likes', () => {
  const likeRoute = commentRouter.stack.find(
    (layer) => layer.route && layer.route.path === '/comments/:id/like'
  );

  assert.ok(likeRoute);
  assert.equal(likeRoute.route.stack.length, 2);
});
