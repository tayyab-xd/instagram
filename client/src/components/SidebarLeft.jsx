import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useState } from "react";
import RequestsModal from "./RequestsModal"; // make sure this path is correct

export default function SidebarLeft() {
  const { state, dispatch } = useApp();
  const { user } = state; // current logged-in user
  const [openReqModal, setOpenReqModal] = useState(false);
// console.log(user);


  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <>
      <div className="space-y-4 mt-10">
        <Link to="/home" className="block p-2 hover:bg-gray-800 rounded cursor-pointer"> Home</Link>
        <div className="p-2 hover:bg-gray-800 rounded cursor-pointer"> Messages</div>

        {/* Requests Button */}
        {
          user.isPrivate &&
          <div
            onClick={() => setOpenReqModal(true)}
            className="p-2 hover:bg-gray-800 rounded cursor-pointer"
          >
            Requests
          </div>
        }

        <div className="p-2 hover:bg-gray-800 rounded cursor-pointer"> Notifications</div>
        <Link to="/profile" className="block p-2 hover:bg-gray-800 rounded cursor-pointer"> Profile</Link>
        <div onClick={handleLogout} className="p-2 hover:bg-gray-800 rounded cursor-pointer text-red-500"> Logout</div>
      </div>

      {/* Requests Modal */}
      {user && (
        <RequestsModal
          open={openReqModal}
          onClose={() => setOpenReqModal(false)}
          currentUser={user}
        />
      )}
    </>
  );
}
