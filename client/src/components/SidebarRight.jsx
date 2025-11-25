import { useState, useEffect } from "react";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { NavLink } from "react-router-dom";

export default function SidebarRight() {
  const { state } = useApp();
  const { user } = state;
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggested = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/suggested/${user._id}`);

      setList(res.data);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };


  const followUser = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${id}/follow`, {
        currentUser: user._id,
      });

      // Update UI instantly by removing the user from the list
      setList((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchSuggested();
    }
  }, [user]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;


  return (
    <div className="space-y-4 mt-10">
      <div className="p-2 bg-gray-800 rounded">
        <div className="font-bold">Your Profile</div>
        <div>@{user?.username}</div>
      </div>



      <h2 className="text-xl font-bold mb-4">Suggested for you</h2>

      {list.length === 0 && (
        <p className="text-gray-500 mt-10 text-center">
          No suggestions — You're following everyone
        </p>
      )}

      <div className="flex flex-col gap-4">
        {list && list.map((user) => (
          <div
            key={user._id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <img
                src={user.profilePic || "/default.jpg"}
                className="w-12 h-12 rounded-full object-cover"
              />

              <div>
                <NavLink to={`/user/${user._id}`}><p className="font-bold text-white">{user.username}</p></NavLink>
                <p className="text-sm text-gray-500">
                  {user.bio || "No bio"}
                </p>
              </div>
            </div>

            {/* Follow Button */}
            <button
              onClick={() => followUser(user._id)}
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Follow +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
