import { useEffect, useState } from "react";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState(null);

  const loadPosts = async () => {
    if (loading) return;

    setLoading(true);

    const res = await fetch(`http://localhost:5000/api/posts/feed?page=${page}&limit=5`);
    const data = await res.json();
    console.log(data);

    setPosts((prev) => [...prev, ...data.posts]);
    setNextPage(data.nextPage);
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, [page]);

  // Infinite Scroll Listener
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

  return (
    <div className="max-w-lg mx-auto p-4">
      {posts.map((post) => (
        <div key={post._id} className="bg-white shadow rounded mb-4 p-4">
          <div className="flex items-center gap-3 mb-2">
            <img
              src={post.user?.profilePic || "https://via.placeholder.com/40"}
              className="w-10 h-10 rounded-full"
            />
            <p className="font-bold text-black">{post.user?.username || "Unknown"}</p>
          </div>

          {post.mediaType === "video" ? (
            <video src={post.mediaUrl} controls className="w-full rounded" />
          ) : (
            <img src={post.mediaUrl} className="w-full rounded" />
          )}

          <p className="mt-2 text-black">{post.caption}</p>
        </div>
      ))}

      {loading && (
        <p className="text-center py-4 text-gray-500">Loading...</p>
      )}
    </div>
  );
}
