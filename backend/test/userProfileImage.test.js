const test = require('node:test');
const assert = require('node:assert/strict');

const User = require('../models/userSchema');
const userController = require('../controller/userController');

const originalFindOne = User.findOne;
const originalFindByIdAndUpdate = User.findByIdAndUpdate;

const buildResponse = () => {
  const res = {
    statusCode: 200,
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    },
    send(payload) {
      this.jsonPayload = payload;
      return this;
    },
  };

  return res;
};

test('updateUser persists a profile image when provided', async () => {
  User.findOne = async () => null;
  User.findByIdAndUpdate = (id, update, options) => {
    assert.equal(id, 'user-123');
    assert.deepEqual(update, {
      name: 'Alice',
      email: 'alice@example.com',
      image: 'https://example.com/avatar.png',
    });
    assert.deepEqual(options, { new: true });

    return {
      select() {
        return Promise.resolve({
          _id: 'user-123',
          name: 'Alice',
          email: 'alice@example.com',
          role: 'Reader',
          image: 'https://example.com/avatar.png',
        });
      },
    };
  };

  const req = {
    user: { userId: 'user-123' },
    body: {
      name: 'Alice',
      email: 'alice@example.com',
      image: 'https://example.com/avatar.png',
    },
  };
  const res = buildResponse();

  await userController.updateUser(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.jsonPayload.success, true);
  assert.equal(res.jsonPayload.data.image, 'https://example.com/avatar.png');
});

test('updateUser clears the profile image when image is removed', async () => {
  User.findOne = async () => null;
  User.findByIdAndUpdate = (id, update, options) => {
    assert.equal(id, 'user-456');
    assert.deepEqual(update, {
      name: 'Bob',
      email: 'bob@example.com',
      image: null,
    });
    assert.deepEqual(options, { new: true });

    return {
      select() {
        return Promise.resolve({
          _id: 'user-456',
          name: 'Bob',
          email: 'bob@example.com',
          role: 'Author',
          image: null,
        });
      },
    };
  };

  const req = {
    user: { userId: 'user-456' },
    body: {
      name: 'Bob',
      email: 'bob@example.com',
      image: '',
    },
  };
  const res = buildResponse();

  await userController.updateUser(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.jsonPayload.success, true);
  assert.equal(res.jsonPayload.data.image, null);
});

process.on('exit', () => {
  User.findOne = originalFindOne;
  User.findByIdAndUpdate = originalFindByIdAndUpdate;
});
