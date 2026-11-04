import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Reader');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password, role);
      toast.info("Registered. Please login.");
      navigate('/login');
    } catch (err) {
      toast
        .error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-slate-100">Register</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full rounded border border-gray-200 bg-white p-2.5 text-gray-900 outline-none transition-colors duration-300 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
        <input className="w-full rounded border border-gray-200 bg-white p-2.5 text-gray-900 outline-none transition-colors duration-300 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" className="w-full rounded border border-gray-200 bg-white p-2.5 text-gray-900 outline-none transition-colors duration-300 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-full rounded border border-gray-200 bg-white p-2.5 text-gray-900 outline-none transition-colors duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="Author">Author</option>
          <option value="Reader">Normal User</option>
        </select>
        <button className="rounded bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-500">Register</button>
      </form>
    </div>
  );
}
