import { useState } from "react"
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";

export default function CreateCategory() {

    const [newCategory, setNewCategory] = useState('');
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();

        const trimmed = newCategory.trim();
        if (!trimmed) {
            toast.warning("Category name is required");
            return;
        }

        try {
            const res = await api.post('/categories', { name: trimmed });
            if (res.data?.success) {
                navigate('/create');
                return;
            }

            toast.error(res.data?.message || 'Error creating category');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error creating category');
        }
    }

    return (
        <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900">
            <form onSubmit={submit} className="space-y-4">
                <input className="w-full rounded border border-gray-200 bg-white p-2.5 text-gray-900 outline-none transition-colors duration-300 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400" placeholder="Category" value={newCategory} onChange={e => setNewCategory(e.target.value)} required />
                <button className="rounded bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-500">Create</button>
            </form>
        </div>
    )
}