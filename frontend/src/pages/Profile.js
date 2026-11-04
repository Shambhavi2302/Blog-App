import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import PostCard from '../components/PostCard';

export default function Profile() {
    const { user, updateUser } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState("Saved Posts");
    const [isDirty, setIsDirty] = useState(false);
    const [posts, setPosts] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [profileInfo, setProfileInfo] = useState({
        name: user?.name || '',
        email: user?.email || '',
        image: user?.image || null,
    });
    const activeProfileImage = profileInfo.image ?? user?.image ?? null;
    const profileName = profileInfo.name || user?.name || 'Guest';
    const profileEmail = profileInfo.email || user?.email || 'No email on file';

    const load = async () => {
        try {
            const res = await api.get('/savedPosts');
            setPosts(res.data.data);
        }
        catch (e) {
            console.error(e);
        }
    }

    useEffect(() => { load(); }, []);

    useEffect(() => {
        if (user) {
            setProfileInfo((prev) => ({
                name: prev.name || user.name || '',
                email: prev.email || user.email || '',
                image: prev.image ?? user.image ?? null,
            }));
        }
    }, [user]);

    const openEditModal = () => {
        setIsDirty(false);
        setSelectedImageFile(null);
        setProfileInfo({
            name: user?.name || '',
            email: user?.email || '',
            image: user?.image || null,
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => setIsEditModalOpen(false);

    const handleFieldChange = (field, value) => {
        setIsDirty(true);
        setProfileInfo((prev) => ({ ...prev, [field]: value }));
    };

    const handleAvatarSelection = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSelectedImageFile(file);
        handleFieldChange('image', URL.createObjectURL(file));
        event.target.value = '';
    };

    const removeProfileImage = () => {
        setSelectedImageFile(null);
        handleFieldChange('image', null);
    };

    const saveProfile = async () => {
        if (!isDirty) {
            console.log("No changes made");
            return;
        }

        const nextName = profileInfo.name?.trim() || 'Guest';
        const nextEmail = (profileInfo.email || user?.email || '').trim();
        const nextImage = profileInfo.image || null;

        try {
            const formData = new FormData();
            formData.append('name', nextName);
            formData.append('email', nextEmail);

            if (selectedImageFile) {
                formData.append('image', selectedImageFile);
            } else if (nextImage === null && user?.image) {
                formData.append('image', '');
            } else if (nextImage === null) {
                formData.append('image', '');
            }

            const response = await api.patch('/updateUser', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const nextUser = response?.data?.data || {
                name: nextName,
                email: nextEmail,
                image: nextImage,
            };
            updateUser?.({
                name: nextUser.name || nextName,
                email: nextUser.email || nextEmail,
                image: nextUser.image ?? nextImage,
            });
            setProfileInfo((prev) => ({ ...prev, name: nextName, email: nextEmail, image: nextUser.image ?? nextImage }));
            setSelectedImageFile(null);
            setIsDirty(false);
            setIsEditModalOpen(false);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <>
            <div className="mx-auto max-w-[1400px] rounded-[28px] bg-white px-4 py-6 text-gray-900 shadow-2xl shadow-black/10 sm:px-6 md:px-8 lg:px-10 dark:bg-[#1d1f22] dark:text-white dark:shadow-black/20">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.9fr)_360px]">
                    <section className="min-w-0">
                        <header className="mb-7 flex items-start justify-between gap-4">
                            <h1 className="text-3xl font-black tracking-[-0.06em] text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl dark:text-[#f3f4f6]">
                                {profileName}
                            </h1>
                        </header>

                        <nav className="mb-8 flex flex-wrap items-center gap-7 border-b border-gray-200 pb-6 text-lg text-gray-600 dark:border-white/10 dark:text-gray-300">
                            {['Saved Posts', 'Info'].map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setActiveTab(item)}
                                    className={`transition hover:text-gray-900 dark:hover:text-white ${activeTab === item
                                        ? "border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white"
                                        : ""
                                        }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </nav>

                        {
                            activeTab === "Saved Posts" ?
                                <>
                                    <div className="space-y-4">
                                        {posts.length === 0 ? (
                                            <div className="text-gray-500 dark:text-gray-400">No saved posts yet.</div>
                                        ) : (
                                            posts.map((post) => (
                                                <PostCard key={post?._id || post?.slug || Math.random()} post={post} />
                                            ))
                                        )}
                                    </div>
                                </>
                                :
                                <>
                                    <div className="max-w-3xl leading-relaxed text-gray-700 dark:text-gray-300">
                                        <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">Welcome to BlogNest</h2>
                                        <p>
                                            BlogNest is a community-driven platform where readers can discover
                                            insightful stories, learn new skills, find inspiration, and explore
                                            diverse perspectives. Save your favorite articles, follow talented
                                            writers, and join a growing community passionate about sharing ideas
                                            and knowledge.
                                        </p>
                                    </div>
                                </>
                        }

                    </section>

                    <aside className="border-gray-200 pt-2 lg:border-l lg:pl-8 dark:border-white/10">
                        <div className="flex flex-col items-center justify-center lg:items-start">
                            {activeProfileImage ? (
                                <img
                                    src={activeProfileImage}
                                    alt={profileName}
                                    className="flex h-40 w-40 items-center justify-center rounded-full object-cover shadow-lg shadow-black/20"
                                />
                            ) : (
                                <div className="flex h-40 w-40 items-center justify-center rounded-full bg-[#8aa2ab] text-5xl font-medium text-white shadow-lg shadow-black/20">
                                    {(profileName || 'G').charAt(0).toUpperCase()}
                                </div>
                            )}

                            <h1 className="mt-4 text-2xl font-black text-gray-900 sm:text-3xl dark:text-[#f3f4f6]">{profileName}</h1>
                            <p className="mt-3 text-base text-gray-600 sm:text-lg dark:text-gray-300">{profileEmail}</p>

                            <div className="mt-8 text-center lg:text-left">
                                <button
                                    type="button"
                                    onClick={openEditModal}
                                    className="inline-flex items-center justify-center rounded-full bg-transparent px-5 py-2 text-xl font-medium text-emerald-600 transition hover:bg-emerald-500/10 dark:text-[#4ade80]"
                                >
                                    Edit profile
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
                    <div className="mx-auto w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-[28px] bg-white p-5 text-gray-900 shadow-2xl shadow-black/20 dark:bg-[#1d1f22] dark:text-white dark:shadow-black/50 sm:p-8">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-black tracking-[-0.04em] text-gray-900 sm:text-3xl dark:text-[#f3f4f6]">Profile information</h2>
                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="text-3xl leading-none text-gray-500 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                                aria-label="Close profile editor"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mb-8 space-y-6">
                            <div className="flex flex-col gap-4">
                                <label className="text-lg font-medium text-gray-700 sm:text-xl dark:text-gray-200">Photo</label>

                                <div className="flex items-center gap-5">
                                    {profileInfo.image ? (
                                        <img
                                            src={profileInfo.image}
                                            alt={profileInfo.name || 'Profile'}
                                            className="flex h-28 w-28 items-center justify-center rounded-full object-cover shadow-lg shadow-black/20 sm:h-32 sm:w-32"
                                        />
                                    ) : (
                                        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#8aa2ab] text-5xl font-medium text-white shadow-lg shadow-black/20 sm:h-32 sm:w-32 sm:text-6xl">
                                            {(profileInfo.name || 'G').charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <div className="flex gap-4 text-base font-medium sm:text-lg">
                                        <input
                                            id="profile-image-input"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarSelection}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="profile-image-input"
                                            className="cursor-pointer text-emerald-600 hover:text-emerald-500 dark:text-[#5ee7a7] dark:hover:text-[#7af0b2]"
                                        >
                                            Update
                                        </label>
                                        <button type="button" onClick={removeProfileImage} className="text-red-500 hover:text-red-400 dark:text-[#ff6b6b] dark:hover:text-[#ff8b8b]">Remove</button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="mb-2 block text-lg font-medium text-gray-700 sm:text-xl dark:text-gray-200">Name*</label>
                                    <input
                                        type="text"
                                        value={profileInfo.name}
                                        onChange={(e) => handleFieldChange('name', e.target.value)}
                                        placeholder="Your name"
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-lg text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#8aa2ab] sm:text-xl dark:border-gray-600 dark:bg-[#2f3337] dark:text-white"
                                    />
                                    <div className="mt-2 text-right text-sm text-gray-500 dark:text-gray-400">{Math.min((profileInfo.name || '').length, 50)}/50</div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-lg font-medium text-gray-700 sm:text-xl dark:text-gray-200">Email</label>
                                    <input
                                        type="email"
                                        value={profileInfo.email}
                                        readOnly
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-lg text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#8aa2ab] sm:text-xl dark:border-gray-600 dark:bg-[#2f3337] dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-white/10">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <h3 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">About Page</h3>
                                <button type="button" className="text-xl text-gray-500 hover:text-gray-900 sm:text-2xl dark:text-gray-300 dark:hover:text-white" aria-label="Expand about page">
                                    ↗
                                </button>
                            </div>

                            <p className="max-w-3xl text-base leading-relaxed text-gray-700 sm:text-lg dark:text-gray-300">
                                Keep your public profile grounded in the information saved for your account, including your email and display name.
                            </p>

                            <div className="mt-10 flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="rounded-full border border-gray-300 bg-transparent px-4 py-2 text-base font-medium text-gray-700 transition hover:bg-gray-100 sm:px-6 sm:py-2.5 sm:text-lg dark:border-gray-500 dark:text-gray-100 dark:hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={saveProfile}
                                    className="rounded-full bg-gray-200 px-4 py-2 text-base font-medium text-gray-900 transition hover:bg-white sm:px-6 sm:py-2.5 sm:text-lg dark:bg-[#d1d5db] dark:text-[#1d1f22] dark:hover:bg-white"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}