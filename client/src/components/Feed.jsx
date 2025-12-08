import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart, FaRegComment } from "react-icons/fa";
import CommentModal from "../components/CommentModal";
import { NavLink } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const { state } = useApp();
  const { user } = state;

  const loadPosts = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:5000/api/posts/feed?page=${page}&limit=5`);
      const data = await res.json();

      // console.log(data);

      setPosts((prev) => [...prev, ...data.posts]);
      setNextPage(data.nextPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [page]);

  // Infinite Scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
        nextPage
      ) {
        setPage(nextPage);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [nextPage]);

  // Toggle Like
const toggleLike = async (postId) => {
  try {
    const res = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: user._id }),
    });

    const updated = await res.json();
    console.log("Updated post:", updated);

    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId ? { ...p, likes: updated.likes } : p
      )
    );
  } catch (err) {
    console.error(err);
  }
};


  return (
    <div className="max-w-lg mx-auto p-4 bg-black min-h-screen">
      {posts.map((post) => (
        <div key={post._id} className="bg-gray-900 rounded mb-4 p-4 shadow">

          {/* USER INFO */}
          <div className="flex items-center gap-3 mb-2">
            <img
              src={post.user?.profilePic || "https://via.placeholder.com/40"}
              className="w-10 h-10 rounded-full"
            />
            <NavLink to={user._id === post.user._id ? "/profile" : `/user/${post.user?._id}`}><p className="font-bold text-white">{post.user?.username}</p></NavLink>
          </div>

          {/* MEDIA */}
          {post.mediaType === "video" ? (
            <video src={post.mediaUrl} controls className="w-full rounded" />
          ) : (
            <img src={post.mediaUrl} className="w-full rounded" />
          )}

          {/* LIKE + COMMENTS */}
          <div className="flex items-center gap-5 mt-3 text-white text-2xl">

            {/* LIKE BUTTON */}
            <button onClick={() => toggleLike(post._id)}>
              {post.likes?.includes("YOUR_USER_ID") ? (
                <FaHeart className="text-red-500" />
              ) : (
                <FaRegHeart />
              )}
            </button>

            {/* COMMENT BUTTON */}
            <button onClick={() => setSelectedPost(post)}>
              <FaRegComment />
            </button>
          </div>

          {/* LIKE COUNT */}
          <p className="text-white font-semibold mt-2">
            {post.likes?.length || 0} likes
            <br />
            {post.comments?.length || 0} comments
          </p>

          {/* CAPTION */}
          <p className="mt-1 text-gray-200">{post.caption}</p>

        </div>
      ))}

      {loading && <p className="text-center py-4 text-gray-400">Loading...</p>}

      {/* COMMENT MODAL */}
      {selectedPost && (
        <CommentModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
