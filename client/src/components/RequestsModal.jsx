import { useEffect, useState } from "react";

const RequestsModal = ({ open, onClose, currentUser }) => {
  const [requests, setRequests] = useState([]);

  // Fetch all follow requests
  const fetchRequests = async () => {
    const res = await fetch(
      `http://localhost:5000/api/users/${currentUser._id}/requests`
    );
    const data = await res.json();
    setRequests(data);
  };

  useEffect(() => {
    if (open) fetchRequests();
  }, [open]);

  // Accept Request
  const acceptRequest = async (requesterId) => {
    await fetch(
      `http://localhost:5000/api/users/${currentUser._id}/accept-request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId }),
      }
    );

    setRequests((prev) =>
      prev.filter((r) => r._id !== requesterId)
    );
  };

  // Reject Request
  const rejectRequest = async (requesterId) => {
    await fetch(
      `http://localhost:5000/api/users/${currentUser._id}/reject-request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId }),
      }
    );

    setRequests((prev) =>
      prev.filter((r) => r._id !== requesterId)
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
      <div className="bg-white p-5 rounded w-[350px]">

        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">Follow Requests</h2>
          <button onClick={onClose} className="text-red-500">X</button>
        </div>

        {requests.length === 0 ? (
          <p className="text-gray-500 text-center">No requests</p>
        ) : (
          requests.map((req) => (
            <div
              key={req._id}
              className="flex items-center justify-between mb-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={req.profilePic || "/default.png"}
                  className="w-10 h-10 rounded-full"
                />
                <span className="font-medium">{req.username}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => acceptRequest(req._id)}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Accept
                </button>

                <button
                  onClick={() => rejectRequest(req._id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RequestsModal;
