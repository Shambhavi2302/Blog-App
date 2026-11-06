import React, { useState, useContext } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { formats,modules } from '../config/quillConfig';
import { toast } from 'react-toastify';

const normalizePostStatus = (value) => {
  const nextValue = String(value || '').trim();
  if (nextValue.toLowerCase() === 'draft') return 'Draft';
  return 'Published';
};

const isQuillEmpty = (value) => !String(value || '').replace(/<[^>]*>/g, '').trim();

export default function CreatePost(){
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [categories,setCategories]=useState([]);
  const [status, setStatus] = useState('Published');
  const [cover, setCover] = useState(null);

  const role = String(user?.role || '').trim();
  const isAuthor = role.toLowerCase() === 'author';

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        const categoryList = res.data?.data || [];
        setCategories(categoryList);

        if (categoryList.length > 0 && !category) {
          setCategory(categoryList[0]._id);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };

    fetchCategories();
  }, [category]);

  if (!user || !isAuthor) {
    return <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">You must be logged in as an Author to create posts.</div>;
  }

  const submit = async (e) =>{
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (isQuillEmpty(content)) {
      toast.error('Post content is required');
      return;
    }

    if (!category) {
      toast.error('Please select a category');
      return;
    }

    if (!cover) {
      toast.error('Cover image is required');
      return;
    }

    try{
      const normalizedStatus = normalizePostStatus(status);
      const form = new FormData();
      form.append('title', title);
      form.append('content', content);
      form.append('category', category);
      form.append('status', normalizedStatus);
      if (cover) form.append('coverImage', cover);

      const res = await api.post('/post', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const responseStatus = normalizePostStatus(res.data?.status || normalizedStatus);
      toast.success(responseStatus === 'Draft' ? 'Draft saved' : 'Post created');

      if (responseStatus === 'Draft') {
        navigate('/dashboard', { replace: true });
        return;
      }

      navigate(`/posts/${res.data.slug || res.data._id}`, { replace: true });
    }catch(err){
      toast.error(err.response?.data?.message || 'Error creating post');
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-slate-100">Create Post</h2>
      <form onSubmit={submit} className="space-y-4">
        <input className="w-full rounded border border-gray-200 bg-white p-2.5 text-gray-900 outline-none transition-colors duration-300 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required />

        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full rounded border border-gray-200 bg-white p-2.5 text-gray-900 outline-none transition-colors duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {categories.length === 0 ? (
              <option value="">No categories available</option>
            ) : (
              categories.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))
            )}
          </select>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
            No category exists?{' '}
            <Link to="/category" className="font-medium text-indigo-600 underline-offset-2 transition-colors hover:text-indigo-500 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300">
              Create One
            </Link>
          </p>

          <label className="flex flex-col gap-2 text-sm text-gray-700 dark:text-slate-200">
            <span>Post status</span>
            <select
              id="post-status"
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="rounded border border-gray-200 bg-white p-2.5 text-gray-900 outline-none transition-colors duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </label>
        </div>

        <div className="rounded border border-gray-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
          <ReactQuill
            modules={modules}
            formats={formats}
            value={content}
            onChange={setContent}
            aria-label="Post content"
          />
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={e => setCover(e.target.files?.[0] || null)}
          className="block text-sm text-gray-600 file:mr-4 file:rounded file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white dark:text-slate-300"
          required
        />
        <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-500">Create</button>
      </form>
    </div>
  );
}
