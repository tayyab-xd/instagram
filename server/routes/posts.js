import express from "express";
import Post from "../models/Post.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // memory storage

// Create Post with image/video
router.post("/", upload.single("file"), async (req, res) => {
  console.log('upload post hit');

  try {
    const { userId, caption } = req.body;
    const file = req.file;
    console.log(userId, caption);
    // console.log(file);

    if (!file) return res.status(400).json({ message: "No file uploaded" });

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

    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get All Posts
router.get("/feed", async (req, res) => {
  try {
    let { page = 1, limit = 5 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate("user", "username profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      posts,
      nextPage: posts.length === limit ? page + 1 : null
    });

  } catch (err) {
    res.status(500).json({ message: "Failed to load feed" });
  }
});

// Like/Unlike Post
router.put("/:postId/like", async (req, res) => {
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

export default router;
