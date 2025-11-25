import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import axios from "axios";
import EditProfileModal from "../components/EditProfileModal";
import SettingsModal from "../components/SettingsModal";

export default function Profile() {
    const { state } = useApp();
    const { user } = state;

    const [profileData, setProfileData] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // settings modal
    const [showSettings, setShowSettings] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);

    useEffect(() => {
        // console.log(user);
        if (!user?._id) return;
        

        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/users/${user._id}`);
                // console.log('ye data hai', res.data);

                setProfileData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", user._id);

        try {
            const res = await axios.put(`http://localhost:5000/api/users/${user._id}/profile-pic`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setProfileData((prev) => ({ ...prev, profilePic: res.data.profilePic }));
        } catch (err) {
            console.error("Error updating profile pic:", err);
        }
    };

    const handleDeleteProfilePic = async () => {
        if (!window.confirm("Are you sure you want to remove your profile picture?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/users/${user._id}/profile-pic`);
            setProfileData((prev) => ({ ...prev, profilePic: "" }));
        } catch (err) {
            console.error("Error deleting profile pic:", err);
        }
    };

    if (!user)
        return <div className="text-white text-center mt-10">Please login to view profile</div>;

    if (loading)
        return <div className="bg-gray-900 text-center mt-10 text-amber-900">Loading...</div>;

    return (
        <div className="mx-auto p-4 text-white bg-gray-900">

            <button
                onClick={() => setShowSettings(true)}
                className="px-3 py-1 bg-gray-700 rounded"
            >
                Settings
            </button>

            {showSettings && (
                <SettingsModal
                    user={user}
                    onClose={() => setShowSettings(false)}
                    onEditProfile={() => {
                        setShowSettings(false);
                        setShowEditProfile(true);
                    }}
                />
            )}

            {showEditProfile && (
                <EditProfileModal
                    user={user}
                    onClose={() => setShowEditProfile(false)}
                />
            )}
            {showEditModal && (
                <EditProfileModal user={user} onClose={() => setShowEditModal(false)} />
            )}

            <div className="flex items-center gap-8 mb-8 border-b border-gray-800 pb-8">
                <div className="relative group">
                    <img
                        src={profileData?.profilePic || "https://img.freepik.com/premium-vector/vector-flat-illustration-grayscale-avatar-user-profile-person-icon-gender-neutral-silhouette-profile-picture-suitable-social-media-profiles-icons-screensavers-as-templatex9xa_719432-2210.jpg?semt=ais_hybrid&w=740&q=80"}
                        className="w-32 h-32 rounded-full object-cover border-2 border-gray-700"
                        alt="profile"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <label className="cursor-pointer text-white text-xs font-bold hover:underline mb-1">
                            Edit
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </label>
                        {profileData?.profilePic && !profileData?.profilePic.includes("freepik.com") && (
                            <button
                                onClick={handleDeleteProfilePic}
                                className="text-red-500 text-xs font-bold hover:underline"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 text-white">
                    <div className="flex items-center gap-4 mb-4">
                        <h1 className="text-2xl font-light text-white">
                            {profileData?.username}
                        </h1>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="px-4 py-1.5 bg-gray-900 rounded font-semibold text-sm border border-gray-700 hover:bg-gray-800"
                        >
                            Edit Profile
                        </button>
                    </div>

                    <div className="flex gap-8 mb-4 text-gray-300">
                        <div>
                            <span className="font-bold text-white">
                                {profileData?.posts?.length || 0}
                            </span>{" "}
                            posts
                        </div>
                        <div>
                            <span className="font-bold text-white">
                                {profileData?.followers?.length || 0}
                            </span>{" "}
                            followers
                        </div>
                        <div>
                            <span className="font-bold text-white">
                                {profileData?.following?.length || 0}
                            </span>{" "}
                            following
                        </div>
                    </div>

                    <div>
                        <div className="font-bold text-white">
                            {profileData?.username}
                        </div>
                        <div className="whitespace-pre-wrap text-gray-300">
                            {profileData?.bio}
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-3 gap-1 md:gap-4">
                {profileData?.posts?.map((post) => (
                    <div
                        key={post._id}
                        className="aspect-square relative group cursor-pointer bg-gray-900"
                    >
                        {post.mediaType === "video" ? (
                            <video
                                src={post.mediaUrl}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={post.mediaUrl}
                                className="w-full h-full object-cover"
                                alt=""
                            />
                        )}
                        <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-50 transition-all flex flex-col items-center justify-center text-transparent group-hover:text-white font-bold gap-2">
                            <div className="flex items-center gap-1">
                                <span>❤️ {post.likes?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>💬 {post.comments?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
