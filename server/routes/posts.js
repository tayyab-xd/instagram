import express from "express";
import Post from "../models/Post.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import User from "../models/User.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // memory storage

// Create Post with image/video
router.post("/", upload.single("file"), async (req, res) => {

  try {
    const { userId, caption } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Upload to Cloudinary using stream
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: file.mimetype.startsWith("video") ? "video" : "image" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });

    const mediaType = file.mimetype.startsWith("video") ? "video" : "image";

    const post = new Post({
      user: userId,
      mediaUrl: result.secure_url,
      mediaType,
      caption,
    });

    user.posts.push(post._id);
    await user.save();

    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get All Posts
router.get("/feed", async (req, res) => {
  console.log('get feed hit');

  try {
    // Pagination
    let { page = 1, limit = 5 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      // Populate post owner
      .populate("user", "username profilePic")

      // Populate each comment's user
      .populate({
        path: "comments.user",
        select: "username profilePic"
      })

      // Latest posts first
      .sort({ createdAt: -1 })

      // Pagination
      .skip(skip)
      .limit(limit);

    // Response
    res.json({
      posts,
      nextPage: posts.length === limit ? page + 1 : null
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to load feed" });
  }
});

// Like/Unlike Post
router.put("/:postId/like", async (req, res) => {
  console.log('like hit');
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.likes.includes(userId)) post.likes.pull(userId);
    else post.likes.push(userId);

    await post.save();
    res.json(post);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add Comment
router.post("/:postId/comment", async (req, res) => {
  console.log('comment hit');

  try {
    const { userId, text } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user: userId, text });
    await post.save();

    const updatedPost = await Post.findById(req.params.postId)
      .populate("comments.user", "username profilePic");
    res.json(updatedPost);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete Comment
router.delete("/:postId/comment/:commentId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json("Post not found");

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json("Comment not found");


    // Removing the comment
    post.comments.pull(req.params.commentId);
    await post.save();

    res.json("Comment deleted");
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get User's Posts
router.get("/user/:userId", async (req, res) => {
  console.log('get user posts hit');

  try {
    const posts = await Post.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
