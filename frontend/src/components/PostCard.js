import React from 'react';
import { useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import { Tooltip } from "react-tooltip";
import { MdBookmark, MdOutlineBookmarkAdd } from "react-icons/md";
import { FaHandsClapping } from "react-icons/fa6";

const stripHtml = (html) => html ? html.replace(/<[^>]+>/g, '') : '';

const createPreview = (html = '') => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;

  const decodedHtml = textarea.value;

  return decodedHtml
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]*>/g, '')
    .trim();
};

const getPostPreview = (html = '') => {
  const text = createPreview(html);

  if (!text) {
    return '';
  }

  return text.length > 180 ? `${text.slice(0, 100).trim()}...` : text;
};

export default function PostCard({ post = {} }) {
  const authorName = typeof post.author === 'string'
    ? post.author
    : post.author?.name || post.authorName || 'Unknown';

  const [numberOfComments, setNumberOfComments] = useState(0);
  const [isSaved, setIsSaved] = useState(Boolean(post?.isSaved));
  const saveTooltipId = `bookmark-save-${post?._id || 'post'}`;
  const unsaveTooltipId = `bookmark-unsave-${post?._id || 'post'}`;
  const storageKey = `claps-${post?._id || post?.slug || 'post'}`;
  const [claps, setClaps] = useState(() => Number(post?.likes ?? 0));

  useEffect(() => {
    setIsSaved(Boolean(post?.isSaved));
  }, [post?.isSaved]);

  useEffect(() => {
    setClaps(Number(post?.likes ?? 0));
  }, [post?._id, post?.likes]);

  const load = async () => {
    try {
      const res = await api.get(`/comments/getNumberOfCommentsByPost/${post._id}`);
      setNumberOfComments(res.data.count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClapClicks = async () => {
    if (!post?._id) return;

    try {
      const res = await api.post(`/posts/${post._id}/like`, { liked: true });
      const nextClaps = Number(res.data?.data?.likes ?? post?.likes ?? 0);
      setClaps(nextClaps);
      try {
        localStorage.setItem(storageKey, String(nextClaps));
      } catch (error) {
        console.error('Could not save clap count:', error);
      }
    } catch (error) {
      setClaps((currentClaps) => {
        const nextClaps = currentClaps + 1;
        try {
          localStorage.setItem(storageKey, String(nextClaps));
        } catch (saveError) {
          console.error('Could not save clap count:', saveError);
        }
        return nextClaps;
      });
      console.error('Could not sync clap with backend:', error);
    }
  };

  const toggleSavePost = async (postId) => {
    try {
      if (isSaved) {
        await api.delete(`/delete/post/${postId}`);
      } else {
        await api.post(`/save/post/${postId}`);
      }
      setIsSaved((prev) => !prev);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!post?._id) return;
    load();
  }, [post?._id]);

  if (!post || !post._id) {
    return null;
  }

  return (
    <article className="group flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:bg-gray-50 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:p-6 dark:border-slate-700 dark:bg-[#121212] dark:text-slate-100 dark:hover:bg-[#191919]">

      {/* LEFT CONTENT */}
      <div className="flex min-w-0 flex-1 flex-col">

        <Link
          to={`/posts/${post.slug || post._id}`}
          className="mb-3"
        >
          <h2 className="text-2xl font-bold leading-tight text-gray-900 transition-colors group-hover:text-indigo-500 sm:text-3xl dark:text-white dark:group-hover:text-indigo-400">
            {post.title}
          </h2>
        </Link>

        <p className="mb-5 text-base text-gray-600 sm:text-xl line-clamp-2 dark:text-gray-300">
          {getPostPreview(post.content)}
        </p>

        <div className="flex items-center gap-6 text-gray-500 dark:text-gray-400">

          <button
            type="button"
            aria-label="Claps"
            onClick={handleClapClicks}
            className="flex items-center gap-2 rounded-md border border-transparent px-1 py-0.5 text-gray-500 transition-colors hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-gray-400 dark:hover:text-indigo-400"
          >
            <FaHandsClapping />
            <span>{claps}</span>
          </button>

          <div className="flex items-center gap-2">
            <FiMessageCircle size={18} />
            <span>{numberOfComments}</span>
          </div>

          <span>
            {new Date(post.createdAt).toLocaleDateString()}
          </span>

          <span>
            {authorName}
          </span>
          <span>
            {/* <MdOutlineBookmarkAdd size={25} title='Save' data-tooltip-id="bookmark-tooltip"
              data-tooltip-content="Save" /> */}
            {isSaved ? (
              <MdBookmark
                size={25}
                className="text-2xl cursor-pointer text-indigo-400"
                data-tooltip-id={unsaveTooltipId}
                data-tooltip-content="Remove bookmark"
                onClick={() => toggleSavePost(post._id)}
              />
            ) : (
              <MdOutlineBookmarkAdd
                size={25}
                className="text-2xl cursor-pointer hover:text-indigo-400"
                data-tooltip-id={saveTooltipId}
                data-tooltip-content="Save bookmark"
                onClick={() => toggleSavePost(post._id)}
              />
            )}
            <Tooltip id={saveTooltipId} />
            <Tooltip id={unsaveTooltipId} />
          </span>
          
        </div>
        
      </div>

      {/* RIGHT IMAGE */}
      {post.coverImage && (
        <Link
          to={`/posts/${post.slug || post._id}`}
          className="w-full sm:w-auto sm:shrink-0"
        >
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-44 w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105 sm:h-40 sm:w-60"
          />
        </Link>
      )}
    </article>
  );

}


