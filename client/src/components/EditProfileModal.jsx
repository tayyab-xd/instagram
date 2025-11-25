import { useState } from "react";
import axios from "axios";
import { useApp } from "../context/AppContext";

export default function EditProfileModal({ user, onClose }) {
    const { dispatch } = useApp();

    const [name, setName] = useState(user.name || "");
    const [username, setUsername] = useState(user.username);
    const [bio, setBio] = useState(user.bio || "");
    const [file, setFile] = useState(null);

    const handleUpdate = async () => {
        try {
            let profilePic = user.profilePic;

            // Upload new image if user selected
            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("userId", user._id);

                const uploadRes = await axios.post(
                    "http://localhost:5000/api/users/upload",
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    }
                );

                profilePic = uploadRes.data.url;
            }

            const res = await axios.put(`http://localhost:5000/api/users/${user._id}`, {
                userId: user._id,
                name,
                username,
                bio,
                profilePic,
            });

            dispatch({ type: "SET_USER", payload: res.data });
            localStorage.setItem("user", JSON.stringify(res.data));
            onClose();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure you want to delete your profile?")) return;

        try {
            await axios.delete(`http://localhost:5000/api/users/${user._id}`, {
                data: { userId: user._id },
            });

            localStorage.removeItem("user");
            dispatch({ type: "SET_USER", payload: null });

            alert("Account deleted");
            onClose();
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded w-96 space-y-4 text-white">

                <h2 className="font-bold text-xl">Edit Profile</h2>

                {/* OLD PROFILE PIC */}
                <div className="flex flex-col items-center space-y-2">
                    {user.profilePic ? (
                        <img
                            src={user.profilePic}
                            className="w-24 h-24 rounded-full object-cover border"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center">
                            No Photo
                        </div>
                    )}

                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="w-full text-black bg-white rounded p-1"
                    />
                </div>

                {/* NAME */}
                <div>
                    <label className="block text-sm mb-1">Full Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 rounded text-black"
                    />
                </div>

                {/* USERNAME */}
                <div>
                    <label className="block text-sm mb-1">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2 rounded text-black"
                    />
                </div>

                {/* EMAIL (READ ONLY) */}
                <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input
                        type="text"
                        value={user.email}
                        readOnly
                        className="w-full p-2 rounded bg-gray-700 text-gray-300 cursor-not-allowed"
                    />
                </div>

                {/* BIO */}
                <div>
                    <label className="block text-sm mb-1">Bio</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full p-2 rounded text-black"
                        rows={3}
                    ></textarea>
                </div>

                {/* BUTTONS */}
                <div className="flex justify-between pt-2">
                    <button
                        className="px-3 py-1 bg-red-600 rounded"
                        onClick={handleDeleteAccount}
                    >
                        Delete Profile
                    </button>

                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-gray-600 rounded" onClick={onClose}>
                            Cancel
                        </button>
                        <button className="px-3 py-1 bg-blue-500 rounded" onClick={handleUpdate}>
                            Save
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
