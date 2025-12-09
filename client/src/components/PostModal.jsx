import { useState, useEffect } from "react";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { NavLink } from "react-router-dom";
import { FaHeart, FaRegHeart, FaTimes } from "react-icons/fa";

export default function PostModal({ post, onClose }) {
    console.log(post);
    
    const { state } = useApp();
    const { user } = state;
    const [comment, setComment] = useState("");
    const [comments, setComments] = useState(post.comments || []);
    const [likes, setLikes] = useState(post.likes || []);

    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const handleAddComment = async () => {
        if (!comment.trim()) return;

        try {
            const res = await axios.post(`http://localhost:5000/api/posts/${post._id}/comment`, {
                userId: user._id,
                text: comment,
            });

            setComments(res.data.comments);
            setComment("");
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/posts/${post._id}/comment/${commentId}`);
            setComments(comments.filter(c => c._id !== commentId));
        } catch (err) {
            console.error(err);
            alert("Failed to delete comment");
        }
    };

    const toggleLike = async () => {
        try {
            const res = await axios.put(`http://localhost:5000/api/posts/${post._id}/like`, {
                userId: user._id,
            });
            setLikes(res.data.likes);
        } catch (err) {
            console.error(err);
        }
    };

    const isLiked = likes.includes(user._id);

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-black max-w-6xl w-full max-h-[90vh] flex flex-col md:flex-row rounded-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* LEFT SIDE - MEDIA */}
                <div className="md:w-3/5 bg-black flex items-center justify-center relative">
                    {post.mediaType === "video" ? (
                        <video
                            src={post.mediaUrl}
                            controls
                            className="w-full h-full object-contain max-h-[90vh]"
                        />
                    ) : (
                        <img
                            src={post.mediaUrl}
                            alt="Post"
                            className="w-full h-full object-contain max-h-[90vh]"
                        />
                    )}
                </div>

                {/* RIGHT SIDE - COMMENTS & DETAILS */}
                <div className="md:w-2/5 bg-gray-900 flex flex-col max-h-[90vh]">
                    {/* CLOSE BUTTON */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white text-2xl hover:text-gray-400 z-10"
                    >
                        <FaTimes />
                    </button>

                    {/* USER INFO */}
                    <div className="flex items-center gap-3 p-4 border-b border-gray-700">
                        <img
                            src={post.user?.profilePic || "https://via.placeholder.com/40"}
                            className="w-10 h-10 rounded-full"
                            alt="User"
                        />
                        <NavLink
                            to={user._id === post.user._id ? "/profile" : `/user/${post.user?._id}`}
                            className="font-bold text-white hover:underline"
                        >
                            {post.user?.username}
                        </NavLink>
                    </div>

                    {/* CAPTION */}
                    {post.caption && (
                        <div className="p-4 border-b border-gray-700">
                            <p className="text-gray-200">
                                <NavLink
                                    to={user._id === post.user._id ? "/profile" : `/user/${post.user?._id}`}
                                    className="font-bold text-white hover:underline mr-2"
                                >
                                    {post.user?.username}
                                </NavLink>
                                {post.caption}
                            </p>
                        </div>
                    )}

                    {/* COMMENTS LIST */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {comments.length === 0 ? (
                            <p className="text-gray-500 text-center">No comments yet</p>
                        ) : (
                            comments.map((c) => (
                                <div key={c._id} className="flex justify-between items-start gap-2">
                                    <div className="flex items-start gap-2 flex-1">
                                        <img
                                            src={c.user?.profilePic || "https://via.placeholder.com/32"}
                                            className="w-8 h-8 rounded-full"
                                            alt="User"
                                        />
                                        <div className="flex-1">
                                            <NavLink
                                                to={c.user?._id === user._id ? "/profile" : `/user/${c.user?._id}`}
                                                className="font-bold text-white hover:underline text-sm"
                                            >
                                                {c.user?.username}
                                            </NavLink>
                                            <p className="text-gray-300 text-sm">{c.text}</p>
                                        </div>
                                    </div>
                                    {(c.user?._id === user._id || post.user._id === user._id) && (
                                        <button
                                            onClick={() => handleDeleteComment(c._id)}
                                            className="text-red-500 text-xs hover:text-red-400"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* LIKE & COMMENT ACTIONS */}
                    <div className="border-t border-gray-700 p-4">
                        {/* Like Button */}
                        <div className="flex items-center gap-4 mb-2">
                            <button onClick={toggleLike} className="text-2xl">
                                {isLiked ? (
                                    <FaHeart className="text-red-500" />
                                ) : (
                                    <FaRegHeart className="text-white" />
                                )}
                            </button>
                        </div>

                        {/* Like Count */}
                        <p className="text-white font-semibold text-sm mb-3">
                            {likes.length} {likes.length === 1 ? 'like' : 'likes'}
                        </p>

                        {/* Add Comment */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 bg-gray-800 text-white p-2 rounded border border-gray-700 focus:outline-none focus:border-gray-500 text-sm"
                                placeholder="Add a comment..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                            />
                            <button
                                onClick={handleAddComment}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition-colors text-sm"
                            >
                                Post
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
