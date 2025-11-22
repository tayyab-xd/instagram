import { useState } from "react";
import SidebarLeft from "../components/SidebarLeft";
import Feed from "../components/Feed";
import SidebarRight from "../components/SidebarRight";
import UploadPostModal from "../components/UploadPostModal";

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {showModal && <UploadPostModal onClose={()=>setShowModal(false)} />}
      <div className="flex max-w-7xl mx-auto px-4 gap-4">
        <div className="hidden md:flex md:flex-col w-1/4 sticky top-0 h-screen">
          <SidebarLeft />
          <button onClick={()=>setShowModal(true)} className="mt-4 px-4 py-2 bg-blue-500 rounded">New Post</button>
        </div>
        <div className="flex-1 max-w-xl">
          <Feed />
        </div>
        <div className="hidden lg:flex lg:flex-col w-1/4 sticky top-0 h-screen">
          <SidebarRight />
        </div>
      </div>
    </div>
  );
}
