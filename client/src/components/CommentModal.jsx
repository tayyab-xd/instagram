import { useState } from "react";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { NavLink } from "react-router-dom";

export default function CommentModal({ post, onClose }) {
    const { state } = useApp();
    const { user } = state;
    const [comment, setComment] = useState("");
    const [comments, setComments] = useState(post.comments || []);

    const handleAddComment = async () => {
        if (!comment.trim()) return;

        try {
            const res = await axios.post(`http://localhost:5000/api/posts/${post._id}/comment`, {
                userId: user._id,
                text: comment,
            });

            // The backend returns the updated post with populated comments
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
            <div className="bg-gray-900 text-white p-5 rounded w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Comments</h2>

                {/* COMMENTS LIST */}
                <div className="max-h-60 overflow-y-auto mb-3 border-b border-gray-700 pb-3">
                    {comments.map((c, i) => (
                        <div key={i} className="mb-2 flex justify-between items-start">
                            <div className="text-sm flex-1">
                                {c.user?.profilePic && (
                                    <img
                                        src={c.user?.profilePic}
                                        alt="Profile"
                                        className="w-6 h-6 rounded-full mr-2 inline-block"
                                    />
                                )}
                                <NavLink to={c.user?._id === user._id ? "/profile" : `/user/${c.user?._id}`} className="font-bold text-white mr-1 hover:underline">
                                    {c.user?.username}:
                                </NavLink>
                                <span className="text-gray-300">{c.text}</span>
                            </div>

                            {/* Delete Button */}
                            {(c.user?._id === user._id || post.user._id === user._id) && (
                                <button
                                    onClick={() => handleDeleteComment(c._id)}
                                    className="text-red-500 text-xs hover:text-red-400 ml-2"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* ADD COMMENT */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 bg-gray-800 text-white p-2 rounded border border-gray-700 focus:outline-none focus:border-gray-500"
                        placeholder="Add a comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button
                        onClick={handleAddComment}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition-colors"
                    >
                        Post
                    </button>
                </div>

                {/* CLOSE BTN */}
                <button onClick={onClose} className="mt-4 w-full bg-gray-700 py-2 rounded hover:bg-gray-600 transition-colors">
                    Close
                </button>
            </div>
        </div>
    );
}
