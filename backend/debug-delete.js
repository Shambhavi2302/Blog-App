require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('./models/userSchema');
const Post = require('./models/postSchema');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    const email = 'debug-delete-' + Date.now() + '@example.com';
    const password = 'Pass1234!';
    let user = await User.findOne({ email });
    if (!user) {
      const hash = await bcrypt.hash(password, 10);
      user = await User.create({ name: 'DebugUser', email, password: hash, role: 'Author' });
    }

    const post = await Post.create({
      title: 'Debug delete post',
      slug: 'debug-delete-post-' + Date.now(),
      content: 'debug',
      author: user._id,
      status: 'Published'
    });

    const loginRes = await axios.post('http://localhost:4000/api/auth/login', { email, password });
    const token = loginRes.data.token;
    const deleteRes = await axios.delete(`http://localhost:4000/api/posts/${post._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('LOGIN_OK', !!token);
    console.log('DELETE', deleteRes.status, deleteRes.data);
    await Post.findByIdAndDelete(post._id).catch(() => {});
    await User.findByIdAndDelete(user._id).catch(() => {});
    await mongoose.disconnect();
  } catch (err) {
    console.error('ERROR', err.response ? err.response.status : err.message, err.response ? err.response.data : '');
    process.exitCode = 1;
  }
})();
