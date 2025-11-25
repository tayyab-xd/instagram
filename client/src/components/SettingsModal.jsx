import { useState } from "react";
import axios from "axios";
import { useApp } from "../context/AppContext";

export default function SettingsModal({ user, onClose, onEditProfile }) {
  const { dispatch } = useApp();

  // For change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");

  // For delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false);

  const togglePrivacy = async () => {
    const res = await axios.put(`http://localhost:5000/api/users/${user._id}/privacy`, {
      isPrivate: !user.isPrivate
    });

    dispatch({ type: "SET_USER", payload: res.data });
    localStorage.setItem("user", JSON.stringify(res.data));
    // window.location.reload();
  };

  const handleChangePassword = async () => {    
    try {
      const res=await axios.put(`http://localhost:5000/api/users/${user._id}/change-password`, {
         oldPass,
         newPass
      });

      alert("Password changed successfully!");
      setShowPasswordModal(false);
    } catch (err) {
      console.log(err.response.data);
      alert(err.response.data);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/users/${user._id}`);

      dispatch({ type: "LOGOUT" });
      localStorage.removeItem("user");

      alert("Account deleted!");
      window.location.reload();
    } catch (err) {
      alert("Error deleting account");
      console.log(err);
    }
  };

  const logout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 w-80 p-6 rounded text-white space-y-4">

        <h2 className="text-lg font-bold text-center">Settings</h2>

        {/* PRIVACY */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Privacy</h3>

          <div className="flex items-center justify-between">
            <span>Private Account</span>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={user.isPrivate}
                onChange={togglePrivacy}
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full 
                peer peer-checked:after:translate-x-full peer-checked:bg-blue-500
                after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all"></div>
            </label>
          </div>
        </div>

        {/* ACCOUNT */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Account</h3>

          <button
            onClick={onEditProfile}
            className="block w-full text-left px-2 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            Edit Profile
          </button>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="block w-full text-left px-2 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            Change Password
          </button>

          <button
            onClick={logout}
            className="block w-full text-left px-2 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            Logout
          </button>
        </div>

        {/* DANGER */}
        <div>
          {/* <h3 className="text-sm font-semibold mb-2 text-red-400">Danger Zone</h3> */}

          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full text-left px-2 py-2 rounded bg-red-600 hover:bg-red-500"
          >
            Delete Account
          </button>
        </div>

        <button onClick={onClose} className="w-full bg-gray-600 py-2 rounded">Close</button>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded w-80 space-y-4 text-white">
            <h3 className="font-bold text-lg">Change Password</h3>

            <input
              type="password"
              placeholder="Old Password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              className="w-full p-2 text-black rounded"
            />

            <input
              type="password"
              placeholder="New Password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full p-2 text-black rounded"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPasswordModal(false)} className="px-3 py-1 bg-gray-600 rounded">Cancel</button>
              <button onClick={handleChangePassword} className="px-3 py-1 bg-blue-500 rounded">Update</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded w-80 space-y-4 text-white">
            <h3 className="font-bold text-lg text-red-400">Delete Account?</h3>
            <p className="text-sm text-gray-300">This action cannot be undone.</p>

            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-1 bg-gray-600 rounded">Cancel</button>
              <button onClick={handleDeleteAccount} className="px-3 py-1 bg-red-600 rounded">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
