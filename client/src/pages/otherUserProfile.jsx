import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import FollowListModal from "../components/FollowListModal";

const OtherUserProfile = () => {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { state } = useApp();
    const currentUser = state.user;

    // follow list modal
    const [openFollowersModal, setOpenFollowersModal] = useState(false);
    const [openFollowingModal, setOpenFollowingModal] = useState(false);

    const fetchUser = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/users/${id}/${currentUser._id}`);
            setUser(res.data);
            console.log(res.data);
            setLoading(false);

        } catch (err) {
            console.log(err);
            setLoading(false);
        }
    };

    const followUser = async () => {
        try {
            const res = await axios.put(`http://localhost:5000/api/users/${id}/follow`, {
                currentUser: currentUser._id,
            });

            if (res.data === "User has been followed") {
                setUser((prev) => ({
                    ...prev,
                    followers: [...prev.followers, { _id: currentUser._id }]
                }));
            } else if (res.data === "Follow request has been sent") {
                setUser((prev) => ({
                    ...prev,
                    requests: [...(prev.requests || []), currentUser._id],
                    hasRequested: true
                }));
            }
        } catch (err) {
            console.log(err);
        }
    };

    const unfollowUser = async () => {
        try {
            const res = await axios.put(`http://localhost:5000/api/users/${id}/unfollow`, {
                userId: currentUser._id,
            });

            setUser((prev) => ({
                ...prev,
                followers: prev.followers.filter((f) => (f._id || f).toString() !== currentUser._id),
                requests: prev.requests ? prev.requests.filter((r) => r.toString() !== currentUser._id) : [],
                hasRequested: false
            }));
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [id]);



    if (loading) return <p className="text-center mt-10">Loading...</p>;
    if (!user) return <p>User Not Found</p>;

    const isPrivate = user.isPrivate;

    // Check if current user is in followers list
    const isFollower = user.followers?.some(f => (f._id || f)?.toString() === currentUser._id) || false;

    // Check if current user is in requests list
    // Requests are not populated in the backend route, so they are likely IDs
    const isRequested = user.hasRequested || (user.requests && user.requests.some(r => r === currentUser._id || r?.toString() === currentUser._id));

    const canSeeProfile = !isPrivate || isFollower || user._id === currentUser._id;

    return (
        <div className="bg-gray-800 max-w-xl mx-auto p-4">

            {/* HEADER */}
            <div className="flex items-center gap-4 border-b border-gray-700 pb-4">
                <img
                    src={user.profilePic || "/default.jpg"}
                    className="w-20 h-20 rounded-full object-cover"
                />

                <div>
                    <h2 className="text-xl font-bold">@{user.username}</h2>

                    {/* Follow Buttons */}
                    {currentUser._id !== user._id && (
                        <div className="mt-2">
                            {isFollower ? (
                                <button onClick={unfollowUser} className="px-3 py-1 bg-gray-300 rounded">
                                    Following
                                </button>
                            ) : isRequested ? (
                                <button onClick={unfollowUser} className="px-3 py-1 bg-yellow-400 rounded">
                                    Requested
                                </button>
                            ) : (
                                <button onClick={followUser} className="px-3 py-1 bg-blue-500 text-white rounded">
                                    Follow
                                </button>
                            )}

                        </div>
                    )}
                </div>
            </div>

            {/* STATS */}
            <div className="flex justify-around mt-6 text-center">
                <div>
                    <p className="font-bold text-lg">
                        {user.posts?.length}
                    </p>
                    <p className="text-sm">Posts</p>
                </div>

                <div>
                    <button onClick={() => setOpenFollowersModal(true)} className="font-bold text-lg">
                        {user.followers?.length}
                    </button>
                    <p className="text-sm">Followers</p>
                </div>

                <div>
                    <button onClick={() => setOpenFollowingModal(true)} className="font-bold text-lg">
                        {user.following?.length}
                    </button>
                    <p className="text-sm">Following</p>
                </div>
            </div>

            {/* BIO */}
            <div className="mt-4">
                <p>{user.bio || "No bio yet."}</p>
            </div>

            {/* PRIVATE ACCOUNT MESSAGE */}
            {!canSeeProfile && (
                <div className="mt-10 text-center text-gray-500">
                    <p className="text-lg font-semibold">🔒 This Account is Private</p>
                    <p>Follow to see their posts</p>
                </div>
            )}

            {/* POSTS GRID */}
            {canSeeProfile && (
                <div className="grid grid-cols-3 gap-1 mt-6">
                    {user.posts.map((post) => (
                        <div
                            key={post._id}
                            className="aspect-square relative bg-gray-900 group cursor-pointer"
                        >
                            {post.mediaType === "video" ? (
                                <video src={post.mediaUrl} className="w-full h-full object-cover" />
                            ) : (
                                <img src={post.mediaUrl} className="w-full h-full object-cover" />
                            )}

                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-1 transition-all flex items-center justify-center text-white font-semibold opacity-0 group-hover:opacity-50">
                                ❤️ {post.likes.length} &nbsp; • &nbsp; 💬 {post.comments.length}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Follow List Modals */}
            <FollowListModal
                open={openFollowersModal}
                onClose={() => setOpenFollowersModal(false)}
                profileUser={user}
                type="followers"
            />

            <FollowListModal
                open={openFollowingModal}
                onClose={() => setOpenFollowingModal(false)}
                profileUser={user}
                type="following"
            />
        </div>
    );
};

export default OtherUserProfile;
