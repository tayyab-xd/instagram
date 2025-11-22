import { useState, useEffect } from "react";
import axios from "axios";
import { useApp } from "../context/AppContext";

export default function SidebarRight() {
  const { state } = useApp();
  const { user } = state;
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (user?._id) {
      const fetchRequests = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/users/${user._id}/requests`);
          setRequests(res.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchRequests();
    }
  }, [user]);

  const handleAccept = async (requesterId) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${user._id}/accept`, { userId: requesterId });
      setRequests(requests.filter((r) => r._id !== requesterId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (requesterId) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${user._id}/reject`, { userId: requesterId });
      setRequests(requests.filter((r) => r._id !== requesterId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 mt-10">
      <div className="p-2 bg-gray-800 rounded">
        <div className="font-bold">Your Profile</div>
        <div>@{user?.username}</div>
      </div>

      {requests.length > 0 && (
        <div className="p-2 bg-gray-800 rounded">
          <div className="font-bold mb-2">Follow Requests</div>
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req._id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={req.profilePic || "https://via.placeholder.com/30"} className="w-8 h-8 rounded-full" />
                  <span className="text-sm">{req.username}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleAccept(req._id)} className="text-xs bg-blue-500 px-2 py-1 rounded">Accept</button>
                  <button onClick={() => handleReject(req._id)} className="text-xs bg-red-500 px-2 py-1 rounded">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-2 bg-gray-800 rounded">
        <div className="font-bold">Suggestions</div>
        <div>user1, user2, user3</div>
      </div>
    </div>
  );
}
