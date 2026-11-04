import React, { useEffect, useState } from 'react';
import api from '../services/api';
import PostCard from '../components/PostCard';
import { CiSearch } from "react-icons/ci";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(7);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const load = async () => {
    try {
      const params = { page, limit, search, status: 'Published' };
      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const res = await api.get('/posts', { params });
      setPosts(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory]);

  useEffect(() => {
    load();
  }, [page, search, selectedCategory]);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const email = newsletterEmail.trim();

    if (!email) {
      setNewsletterStatus('Please enter your email address.');
      return;
    }

    try {
      const res = await api.post('/newsletter/subscribe', { email });
      setNewsletterStatus(res.data?.message || 'Welcome to our newsletter!');
      setNewsletterEmail('');
    } catch (err) {
      setNewsletterStatus(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  const sidebarTrending = [
    'Electric Vehicles Reshaping the future',
    'Next-Gen Healthcare Emerges',
    'Cybersecurity Threats Continue to Evolve',
  ];

  const topAuthors = [
    'David Henry',
    'Shambhavi Swami',
    'Aarav Nair',
  ];

  return (
    <div className="mx-auto max-w-[1400px] rounded-[28px] border border-gray-200 bg-white p-3 shadow-sm sm:p-4 lg:p-6 dark:border-slate-700 dark:bg-slate-950 dark:shadow-2xl">
      <div className="space-y-5 sm:space-y-6">
        <div className="flex items-center gap-3">
          <div className="relative w-full">
            <CiSearch
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-base text-gray-900 shadow-sm outline-none transition-colors duration-300 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={[
                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-300 sm:px-4 sm:py-2',
                selectedCategory === ''
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
              ].join(' ')}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category._id}
                type="button"
                onClick={() => setSelectedCategory(category._id)}
                className={[
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-300 sm:px-4 sm:py-2',
                  selectedCategory === category._id
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                ].join(' ')}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="w-full sm:hidden">
            <button
              type="button"
              aria-expanded={isCategoryMenuOpen}
              aria-controls="mobile-category-menu"
              onClick={() => setIsCategoryMenuOpen((open) => !open)}
              className="inline-flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-sm font-medium text-gray-700 shadow-sm transition-colors duration-300 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span>Categories</span>
              <span className="text-base font-semibold text-indigo-600 dark:text-indigo-400">{isCategoryMenuOpen ? '−' : '+'}</span>
            </button>

            {isCategoryMenuOpen ? (
              <div id="mobile-category-menu" className="mt-3 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('');
                    setIsCategoryMenuOpen(false);
                  }}
                  className={[
                    'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-300',
                    selectedCategory === ''
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                  ].join(' ')}
                >
                  All
                </button>

                {categories.map((category) => (
                  <button
                    key={category._id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category._id);
                      setIsCategoryMenuOpen(false);
                    }}
                    className={[
                      'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-300',
                      selectedCategory === category._id
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                    ].join(' ')}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="min-w-0">
            {/* <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch"> */}
            <div className="flex flex-col gap-6">
              {posts.map((p, index) => (
                <PostCard key={p._id} post={p} />
              ))}
            </div>
          </div>

          <aside className="w-full space-y-6 lg:sticky lg:top-6 lg:w-[320px] lg:flex-shrink-0">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-slate-100">Trending</h3>
              <ul className="space-y-3">
                {sidebarTrending.map((item, idx) => (
                  <li key={item} className="flex items-start gap-3 border-b border-gray-200 pb-3 last:border-0 last:pb-0 dark:border-slate-700">
                    <span className="text-sm font-semibold text-indigo-500 dark:text-indigo-400">0{idx + 1}</span>
                    <span className="text-sm leading-6 text-gray-700 dark:text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-slate-100">Top authors</h3>
              <ul className="space-y-3">
                {topAuthors.map((author) => (
                  <li key={author} className="flex items-center justify-between text-sm text-gray-700 dark:text-slate-300">
                    <span>{author}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-slate-700 dark:text-slate-200">Editor</span>
                  </li>
                ))}
              </ul>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 text-white shadow-sm">
              <h3 className="mb-2 text-lg font-bold">Newsletter</h3>
              <p className="mb-4 text-sm text-indigo-100">Get the best stories in your inbox every week.</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full rounded px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-300"
                />
                <button type="submit" className="rounded bg-white px-3 py-2 text-sm font-medium text-indigo-700">Join</button>
              </div>
              {newsletterStatus ? (
                <p className="mt-3 text-sm text-indigo-100">{newsletterStatus}</p>
              ) : null}
            </form>
          </aside>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 transition-colors duration-300 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">Prev</button>
          <div className="text-sm text-gray-700 dark:text-slate-200">Page {page} / {totalPages}</div>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 transition-colors duration-300 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">Next</button>
        </div>
      </div>
    </div>
  );
}
