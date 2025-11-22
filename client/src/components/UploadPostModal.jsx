 import { useState } from "react";
import axios from "axios";
import { useApp } from "../context/AppContext";

export default function UploadPostModal({ onClose }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");

  const {state} = useApp();

  const handleUpload = async () => {
    console.log(state);
    
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", state.user.id);
      formData.append("caption", caption);

      await axios.post("http://localhost:5000/api/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onClose();
    } catch (err) { console.log(err); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded w-80 space-y-4">
        <h2 className="font-bold text-lg">Upload Post</h2>

        <input type="file" accept="image/*,video/*" onChange={(e)=>setFile(e.target.files[0])} className="w-full text-black" />

        <textarea placeholder="Caption" className="w-full p-2 rounded text-black" value={caption} onChange={e=>setCaption(e.target.value)} />

        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 bg-gray-600 rounded" onClick={onClose}>Cancel</button>
          <button className="px-3 py-1 bg-blue-500 rounded" onClick={handleUpload}>Upload</button>
        </div>
      </div>
    </div>
  );
}
