import React, { useCallback, useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import CommentForm from '../components/CommentForm';
import { AuthContext } from '../contexts/AuthContext';
import { MdDelete } from "react-icons/md";
import { modules, formats } from '../config/quillConfig';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from "dompurify";

const decodeHtml = (html = '') => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
};

export const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const plainTextToHtml = (value = '') => {
  const text = String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  if (!text) return '';

  const blocks = text.split(/\n\s*\n/).filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block
        .split('\n')
        .map((line) => escapeHtml(line.trim()))
        .filter(Boolean)
        .join('<br />');

      return `<p>${lines || escapeHtml(block.trim())}</p>`;
    })
    .join('');
};

export const buildPostUpdatePayload = ({ title, content } = {}) => {
  const normalizedTitle = String(title ?? '').trim();
  const rawContent = typeof content === 'string' ? content : '';
  const normalizedContent = rawContent.trim()
    ? (rawContent.includes('<') && rawContent.includes('>') ? rawContent : plainTextToHtml(rawContent))
    : '';

  return {
    title: normalizedTitle,
    content: normalizedContent,
  };
};

export default function PostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [postEditing, setPostEditing] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', content: '' });
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [likedComments, setLikedComments] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const { user } = useContext(AuthContext);

  const currentUserId = user && (user.userId || user.id || user._id);
  const isPostLiked = Boolean(post && currentUserId && (post.likedBy || []).some((userId) => String(userId) === String(currentUserId)));
  const isPostOwner = Boolean(post && currentUserId && (String(post.author?._id || post.author || '') === String(currentUserId)));

  const isCommentLiked = (comment) => {
    if (!currentUserId || !comment) return false;
    const likedBy = comment.likedBy || [];
    return likedBy.some((userId) => String(userId) === String(currentUserId));
  };
  const coverPreviewUrl = coverImageFile && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
    ? URL.createObjectURL(coverImageFile)
    : null;

  const loadComments = useCallback(async (postId) => {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/posts/${slug}`);
      setPost(res.data.data);
      loadComments(res.data.data._id);
    } catch (err) {
      console.error(err);
    }
  }, [loadComments, slug]);

  const syncLikedComments = useCallback((commentList = comments, currentUser = user) => {
    const currentUserId = currentUser && (currentUser.userId || currentUser.id || currentUser._id);

    if (!currentUserId) {
      return;
    }

    const nextLikedState = {};

    commentList.forEach((comment) => {
      const likedBy = comment.likedBy || [];
      nextLikedState[comment._id] = likedBy.some(u => String(u) === String(currentUserId));
    });

    setLikedComments(prev => ({ ...prev, ...nextLikedState }));
  }, [comments, user]);

  const handleToggleLike = async (comment) => {
    if (!user) return;

    try {
      const currentState = isCommentLiked(comment);
      const nextLikedState = !currentState;

      const res = await api.post(`/comments/${comment._id}/like`, { liked: nextLikedState });
      const { likes, likedBy } = res.data.data;

      setComments(prev => prev.map(c => c._id === comment._id ? { ...c, likes, likedBy } : c));
      setLikedComments(prev => ({ ...prev, [comment._id]: nextLikedState }));
    } catch (err) {
      console.error(err);
    }
  };

  const loadFollowStatus = useCallback(async (authorId) => {
    const followerId = user && (user.userId || user.id || user._id);

    if (!authorId || !followerId) {
      setIsFollowing(false);
      return;
    }

    try {
      const res = await api.get(`/follow/${authorId}/status`, { params: { followerId } });
      setIsFollowing(Boolean(res.data?.following));
    } catch (err) {
      console.error(err);
      setIsFollowing(false);
    }
  }, [user]);

  const handleFollow = async () => {
    if (!post?.author?._id) return;

    try {
      const followerId = user && (user.userId || user.id || user._id);
      if (!followerId) {
        toast.info('Please log in to follow this writer');
        return;
      }

      const res = await api.post(`/follow/${post.author._id}`, { followerId });
      const nextFollowing = Boolean(res.data?.following ?? !isFollowing);
      setIsFollowing(nextFollowing);

      if (nextFollowing) {
        toast.info(`Success! You're now following ${post.author.name}`,
          {
            position: "top-center",
            style: {
              background: "#0f172a",
              color: "#fff",
              border: "1px solid #22c55e",
            },
          });
      } else {
        toast.info(`You unfollowed ${post.author.name}`,
          {
            position: "top-center",
            style: {
              background: "#0f172a",
              color: "#fff",
              border: "1px solid #f59e0b",
            },
          });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePostLike = async () => {
    if (!post || !user) return;

    try {
      const nextLikedState = !isPostLiked;
      const res = await api.post(`/posts/${post._id}/like`, { liked: nextLikedState });
      const { likes, likedBy } = res.data.data;

      setPost(prev => (prev ? { ...prev, likes, likedBy } : prev));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;

    try {
      await api.delete(`/posts/${post._id}`);
      setConfirmDelete(null);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    if (confirmDelete.type === 'post') {
      await handleDeletePost();
      return;
    }

    await handleDelete(confirmDelete.id);
  };

  const handleSavePost = async () => {
    if (!post) return;

    try {
      if (!postForm.title.trim()) return;

      const nextTitle = postForm.title.trim();
      const nextContent = postForm.content;

      if (coverImageFile) {
        const formData = new FormData();
        formData.append('title', nextTitle);
        formData.append('content', nextContent);
        formData.append('coverImage', coverImageFile);

        const res = await api.patch(`/posts/${post._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setPost((prev) => ({
          ...prev,
          title: nextTitle,
          content: nextContent,
          coverImage: res.data?.data?.coverImage || prev.coverImage,
        }));
        setCoverImageFile(null);
        setPostEditing(false);
        load();
        return;
      }

      const payload = {
        title: nextTitle,
        content: nextContent,
      };

      await api.patch(`/posts/${post._id}`, payload);
      setPost((prev) => ({ ...prev, title: payload.title, content: payload.content }));
      setPostEditing(false);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (post) {
      setPostForm({
        title: post.title || '',
        content: decodeHtml(post.content || ''),
      });
    }
  }, [post]);

  useEffect(() => {
    if (user) {
      syncLikedComments(comments, user);
    } else {
      setLikedComments({});
    }
  }, [comments, syncLikedComments, user]);

  useEffect(() => {
    if (post?.author?._id) {
      loadFollowStatus(post.author._id);
    } else {
      setIsFollowing(false);
    }
  }, [loadFollowStatus, post?.author?._id]);

  if (!post) return <div>Loading...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
              Delete {confirmDelete.type === 'post' ? 'post' : 'comment'}?
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="pt-4 text-gray-900 dark:text-slate-100 xl:pt-12">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-xl font-semibold text-slate-700 shadow-sm dark:from-slate-700 dark:to-slate-500 dark:text-slate-100">
              {(post.author?.name || 'A').charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
              {post.author?.name || 'Author'}
            </h2>
            <button
              type="button"
              onClick={handleFollow}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${isFollowing
                ? 'border-indigo-500 bg-indigo-600 text-white hover:bg-indigo-500'
                : 'border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
            >
              {isFollowing ? 'Following' : 'Follow writer'}
            </button>

            {isFollowing ? (
              <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                <p className="text-emerald-300">Email notifications on</p>
                <button
                  type="button"
                  onClick={handleFollow}
                  className="text-left font-medium text-red-300 hover:text-red-200"
                >
                  Unfollow
                </button>
              </div>
            ) : null}
          </div>
        </aside>

        <article className="rounded-[22px] border border-gray-200 bg-white p-4 text-gray-900 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.15)] sm:p-6 md:p-8 lg:p-10 dark:border-slate-700/90 dark:bg-[#0d1727] dark:text-slate-100 dark:shadow-[0_30px_90px_-35px_rgba(15,23,42,0.8)]">
          <div className="mb-8 flex flex-wrap gap-3">
            {post.category?.name ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-200">
                {post.category.name}
              </span>
            ) : null}
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            {isPostOwner ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPostEditing((prev) => !prev);
                    setCoverImageFile(null);
                    setPostForm({
                      title: post.title || '',
                      content: decodeHtml(post.content || ''),
                    });
                  }}
                  className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  {postEditing ? 'Cancel' : 'Edit Post'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete({ type: 'post', id: post._id })}
                  className="inline-flex items-center gap-2 rounded border border-red-700/40 bg-red-950/30 px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-900/40"
                >
                  <MdDelete size={16} />
                  Delete
                </button>
              </div>
            ) : null}
          </div>

          {postEditing ? (
            <div className="mb-8 space-y-4 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
              <input
                value={postForm.title}
                onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-gray-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Post title"
              />
              <ReactQuill
                theme="snow"
                modules={modules}
                formats={formats}
                value={postForm.content}
                onChange={(value) =>
                  setPostForm((prev) => ({
                    ...prev,
                    content: value,
                  }))
                }
              />
              <label className="flex flex-col gap-2 text-sm text-slate-200">
                <span>Update cover image</span>
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Update cover image"
                  onChange={(event) => setCoverImageFile(event.target.files?.[0] || null)}
                  className="block text-sm text-slate-300 file:mr-4 file:rounded file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                />
                {(coverPreviewUrl ? (
                  <img
                    src={coverPreviewUrl}
                    alt="Selected cover preview"
                    className="h-40 w-full rounded-lg object-cover"
                  />
                ) : post.coverImage ? (
                  <img
                    src={post.coverImage}
                    alt="Current cover"
                    className="h-40 w-full rounded-lg object-cover"
                  />
                ) : null)}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSavePost}
                  className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPostEditing(false);
                    setCoverImageFile(null);
                    setPostForm({
                      title: post.title || '',
                      content: decodeHtml(post.content || ''),
                    });
                  }}
                  className="rounded border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="max-w-5xl text-4xl font-black leading-[0.96] tracking-[-0.06em] text-gray-900 sm:text-5xl lg:text-7xl dark:text-white">
                {post.title}
              </h1>



              <div className="mt-8 flex flex-wrap items-center gap-4 border-b border-gray-200 pb-8 dark:border-slate-700">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-lg font-semibold text-slate-700 dark:from-slate-700 dark:to-slate-500 dark:text-slate-100">
                  {(post.author?.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex items-center gap-3 text-base text-gray-700 dark:text-slate-200">
                  <span className="font-semibold">{post.author?.name || 'Author'}</span>

                </div>
                <span className="text-gray-500 dark:text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>

              {post.coverImage ? (
                <img
                  src={post.coverImage}
                  alt="cover"
                  className="mt-8 h-64 w-full rounded-2xl object-cover shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] sm:h-80 md:h-[28rem]"
                />
              ) : null}

              <div
                className="mt-8 max-w-4xl text-lg leading-8 text-gray-700 prose prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-indigo-600 prose-strong:text-gray-900 dark:text-slate-200 dark:prose-invert dark:prose-headings:text-white dark:prose-p:text-slate-200 dark:prose-a:text-indigo-400 dark:prose-strong:text-white"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
              />
            </>
          )}

          <div className="mt-10 flex items-center justify-between gap-4 border-t border-gray-200 pt-6 text-gray-700 dark:border-slate-700 dark:text-slate-200">
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-slate-300">
              <button
                type="button"
                onClick={handleTogglePostLike}
                disabled={!user}
                className={`flex items-center gap-2 transition focus:outline-none ${user ? 'hover:text-rose-400' : 'cursor-not-allowed opacity-60'}`}
                aria-label={isPostLiked ? 'Unlike post' : 'Like post'}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  style={{ color: isPostLiked ? '#ef4444' : '#cbd5e1', fill: isPostLiked ? '#ef4444' : 'none' }}
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4c1.74 0 3.41.81 4.5 2.09A6.16 6.16 0 0 1 15.5 4 4.5 4.5 0 0 1 20 8.5c0 3.78-3.4 6.86-8.55 11.5L12 21.35Z" />
                </svg>
                <span>{post.likes || 0}</span>
              </button>
              <span className="flex items-center gap-2"><span>💬</span> {comments.length}</span>

            </div>
          </div>
        </article>
      </div>

      <div className="mt-8 xl:pl-[300px]">
        <section className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Comments</h3>
          <div className="mt-4 space-y-4">
            {comments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                No comments yet
              </div>
            ) : (
              comments.map((c) => {
                const currentUserId = user && (user.userId || user.id || user._id);
                const likedBy = c.likedBy || [];
                const isLiked = Boolean(likedComments[c._id]) ||
                  (Boolean(currentUserId) && likedBy.some(u => String(u) === String(currentUserId))) || isCommentLiked(c);

                return (
                  <div key={c._id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-gray-700 dark:text-slate-100">{c.name}</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">{new Date(c.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleLike(c)}
                          disabled={!user}
                          className={`flex items-center text-sm focus:outline-none ${!user ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            style={{ color: isLiked ? '#ef4444' : '#94a3b8', fill: isLiked ? '#ef4444' : 'none' }}
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                          </svg>
                          <span className="ml-1 text-gray-600 dark:text-slate-200">{c.likes || 0}</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 text-gray-800 dark:text-slate-200">
                      {editingId === c._id ? (
                        <div>
                          <textarea
                            className="w-full rounded-lg border border-gray-200 bg-white p-3 text-gray-900 outline-none ring-0 transition-colors duration-300 placeholder:text-gray-500 focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                          />
                          <div className="mt-3 flex items-center gap-3">
                            <button onClick={saveEdit} className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">Save</button>
                            <button onClick={() => { setEditingId(null); setEditContent(''); }} className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap break-words">{c.content}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-6">
            <h4 className="mb-3 text-lg font-semibold text-gray-900 dark:text-slate-100">Leave a comment</h4>
            <CommentForm postId={post._id} onSuccess={() => loadComments(post._id)} />
          </div>
        </section>
      </div>
    </div>
  );
}
