import { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function FollowListModal({ type, open, onClose, profileUser }) {
    // console.log(type);
    
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);

    const { state } = useApp();
    const { user } = state;

    const isOwner = user._id === profileUser._id;

    const fetchSelfList=async()=>{
        try {
            const res = await axios.get(`http://localhost:5000/api/users/get-self-list/${user._id}/${type}`);
            setList(res.data);
            setLoading(false);
            // console.log(res.data);
            
        } catch (err) {
            console.log(err);
        }
    }   
    const fetchOthersList=async()=>{
        try {
            const res = await axios.get(`http://localhost:5000/api/users/get-other-list/${user._id}/${profileUser._id}/${type}`);
            setList(res.data);
            setLoading(false);
            
        } catch (err) {
            console.log(err);
        }
    }   

    useEffect(() => {
        if (!open) return;
        if (isOwner) {
            fetchSelfList();
        } else {
            fetchOthersList();
        }
    }, [open, type, profileUser]);

    const handleRemove = async (targetUserId) => {
        console.log(targetUserId);
        try {
            if (type === "followers") {
                await axios.put(`http://localhost:5000/api/users/remove-follower/${user._id}`, {
                    targetUserId,
                });
            } else {
                await axios.put(`http://localhost:5000/api/users/remove-following/${user._id}`, {
                    targetUserId,
                });
            }

            setList((prev) => prev.filter((u) => u._id !== targetUserId));
        } catch (err) {
            console.error(err);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 w-80 max-h-[80vh] overflow-y-auto p-4 rounded space-y-4 text-white">
                <h2 className="font-bold text-lg">{type === "followers" ? "Followers" : "Following"}</h2>

                {loading ? (
                    <p>Loading...</p>
                ) : list.length === 0 ? (
                    <p>No users</p>
                ) : (
                    list && list.map((u) => (
                        <div key={u._id} className="flex items-center justify-between gap-3 p-2 hover:bg-gray-700 rounded">
                            <div className="flex items-center gap-2">
                                <img src={u.profilePic || "https://via.placeholder.com/40"} className="w-10 h-10 rounded-full" />
                                <NavLink to={u._id === user._id ? "/profile" : `/user/${u._id}`} onClick={onClose}>
                                    <p>{u.username}</p>
                                </NavLink>
                            </div>

                            {/* Remove button only for owner */}
                            {isOwner && (
                                <button
                                    onClick={() => handleRemove(u._id)}
                                    className="px-3 py-1 bg-red-500 rounded text-white text-sm"
                                >
                                    {type=="followers"? "Remove" : "Unfollow"}
                                </button>
                            )}
                        </div>
                    ))
                )}

                <button onClick={onClose} className="mt-2 px-4 py-1 bg-gray-600 rounded">Close</button>
            </div>
        </div>
    );
}
