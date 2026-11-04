import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import { AuthContext } from "../contexts/AuthContext";

export default function CommentForm({ postId, onSuccess }) {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    content: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!user) {
      newErrors.auth = "Please login to comment";
      setErrors(newErrors);
      return false;
    }

    if (!formData.content.trim()) {
      newErrors.content = "Comment is required";
    } else if (formData.content.trim().length < 10) {
      newErrors.content = "Comment must be at least 10 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to comment");
      return;
    }

    if (!validate()) return;

    setLoading(true);

    try {
      await api.post(`/posts/${postId}/comments`, {
        content: formData.content.trim(),
      });

      setFormData({
        name: "",
        email: "",
        content: "",
      });

      setErrors({});

      if (onSuccess) onSuccess();

    } catch (err) {
      toast.error(err.response?.data?.message || "Error submitting comment");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800 sm:p-5">
        <p className="text-sm text-gray-700 dark:text-slate-300">Please login to post a comment.</p>
        <Link
          to="/login"
          className="inline-block rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition-colors duration-300 hover:bg-indigo-500"
        >
          Login to Comment
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800 sm:p-5">
      <div>
        <textarea
          rows={4}
          placeholder="Comment"
          className="w-full rounded-lg border border-gray-200 bg-white p-3 text-gray-900 outline-none transition-colors duration-300 placeholder:text-gray-500 focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400"
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-500">{errors.content}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition-colors duration-300 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {loading ? "Sending..." : "Post Comment"}
      </button>
    </form>
  );
}