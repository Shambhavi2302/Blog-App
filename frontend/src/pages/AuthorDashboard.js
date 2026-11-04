import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const stripHtml = (html) => html ? html.replace(/<[^>]+>/g, '') : '';

const normalizePostStatus = (value) => {
  const nextValue = String(value || '').trim();
  if (nextValue.toLowerCase() === 'draft') return 'Draft';
  if (nextValue.toLowerCase() === 'published') return 'Published';
  return 'Published';
};

export default function AuthorDashboard() {
  const { user } = useContext(AuthContext);
  const userRole = String(user?.role || '').trim().toLowerCase();
  const authorId = user?.id || user?._id || user?.userId;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllPosts, setShowAllPosts] = useState(false);

  useEffect(() => {
    const loadPosts = async () => {
      if (!user || !authorId) return;

      try {
        setLoading(true);
        const res = await api.get('/posts', {
          params: {
            author: authorId,
            status: 'All',
            page: 1,
            limit: 100,
          },
        });
        setPosts(res.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [authorId]);

  const stats = useMemo(() => {
    const published = posts.filter((post) => normalizePostStatus(post.status) === 'Published').length;
    const drafts = posts.filter((post) => normalizePostStatus(post.status) === 'Draft').length;
    const categories = new Set(posts.map((post) => post.category?.name).filter(Boolean)).size;
    // const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);

    return {
      total: posts.length,
      published,
      drafts,
      categories,
      // totalViews,
    };
  }, [posts]);

  const recentPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [posts]);

  const visiblePosts = showAllPosts ? [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : recentPosts;

  const categoryBreakdown = useMemo(() => {
    const groups = {};

    posts.forEach((post) => {
      const name = post.category?.name || 'Uncategorized';
      groups[name] = (groups[name] || 0) + 1;
    });

    return Object.entries(groups)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [posts]);

  if (!user || userRole !== 'author') {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Author access required</h2>
        <p className="mt-3 text-gray-600 dark:text-slate-300">
          Please log in as an author to access the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-500 p-6 text-white shadow-xl shadow-indigo-100/40 dark:shadow-indigo-950/40 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-100">Author workspace</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Welcome back, {user.name || 'Author'}!</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/create"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              + New post
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              View site
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total posts', value: stats.total, accent: 'from-indigo-500 to-indigo-600' },
          { label: 'Published', value: stats.published, accent: 'from-emerald-500 to-emerald-600' },
          { label: 'Drafts', value: stats.drafts, accent: 'from-amber-500 to-amber-600' },
          { label: 'Categories', value: stats.categories, accent: 'from-pink-500 to-pink-600' },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className={`mb-3 h-2 w-20 rounded-full bg-gradient-to-r ${card.accent}`} />
            <div className="text-sm text-gray-500 dark:text-slate-400">{card.label}</div>
            <div className="mt-3 text-3xl font-bold text-gray-900 dark:text-slate-100">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              {showAllPosts ? 'All posts' : 'Recent posts'}
            </h2>
            <span className="text-sm text-gray-500 dark:text-slate-400">
              {showAllPosts ? `${posts.length} total` : `${recentPosts.length} latest`}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              No posts yet. Publish your first story.
            </div>
          ) : (
            <div className="space-y-3">
              {visiblePosts.map((post) => (
                <Link
                  key={post._id}
                  to={`/posts/${post.slug || post._id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700 dark:hover:bg-slate-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{post.title}</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        normalizePostStatus(post.status) === 'Published'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {normalizePostStatus(post.status)}
                    </span>
                  </div>

                  <p className="line-clamp-2 text-sm leading-6 text-gray-600 dark:text-slate-300">
                    {stripHtml(post.content).slice(0, 120)}{stripHtml(post.content).length > 120 ? '...' : ''}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {posts.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllPosts((current) => !current)}
              className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300"
            >
              {showAllPosts ? 'Show recent posts' : 'Show all posts'}
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-slate-100">Category mix</h2>
            <div className="space-y-4">
              {categoryBreakdown.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-slate-400">No categories assigned yet.</p>
              ) : (
                categoryBreakdown.map((item) => (
                  <div key={item.name}>
                    <div className="mb-1 flex items-center justify-between text-sm text-gray-600 dark:text-slate-300">
                      <span>{item.name}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                        style={{ width: `${(item.count / Math.max(...categoryBreakdown.map((entry) => entry.count), 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-slate-100">Quick actions</h2>
            <div className="space-y-3">
              <Link
                to="/create"
                className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-300"
              >
                Create a new article
                <span>→</span>
              </Link>
              <Link
                to="/"
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Explore the public blog
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
