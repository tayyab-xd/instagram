import express from "express";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import bcrypt from "bcrypt";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload File (Profile Pic)
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json("No file uploaded");

        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: "image" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(file.buffer);
        });

        res.status(200).json({ url: result.secure_url });
    } catch (err) {
        res.status(500).json(err);
    }
});

// Follow User
router.put("/:id/follow", async (req, res) => {
    console.log("follow hit");
    if (req.body.currentUser !== req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.currentUser);
            
            if (!user.followers.includes(req.body.currentUser)) {
                if (user.isPrivate) {
                    if (!user.requests.includes(req.body.currentUser)) {
                        await user.updateOne({ $push: { requests: req.body.currentUser } });
                        res.status(200).json("Follow request has been sent");
                    } else {
                        res.status(403).json("You already requested to follow this user");
                    }
                } else {
                    await user.updateOne({ $push: { followers: req.body.currentUser } });
                    await currentUser.updateOne({ $push: { following: req.params.id } });
                    res.status(200).json("User has been followed");
                }
            } else {
                res.status(403).json("You already follow this user");
            }
        } catch (err) {
            console.log(err);
            
            res.status(500).json(err);
        }
    } else {
        res.status(403).json("You cannot follow yourself");
    }
});

// Unfollow User
router.put("/:id/unfollow", async (req, res) => {
    if (req.body.userId !== req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);

            if (user.followers.includes(req.body.userId)) {
                await user.updateOne({ $pull: { followers: req.body.userId } });
                await currentUser.updateOne({ $pull: { following: req.params.id } });
                res.status(200).json("User has been unfollowed");
            } else if (user.requests.includes(req.body.userId)) {
                await user.updateOne({ $pull: { requests: req.body.userId } });
                res.status(200).json("Follow request has been cancelled");
            } else {
                res.status(403).json("You don't follow this user");
            }
        } catch (err) {
            res.status(500).json(err);
        }
    } else {
        res.status(403).json("You cannot unfollow yourself");
    }
});

// Accept Follow Request
router.post("/:id/accept-request", async (req, res) => {
  try {
    const { requesterId } = req.body;  // user who requested
    const user = await User.findById(req.params.id);
    const requester = await User.findById(requesterId);

    if (!user || !requester)
      return res.status(404).json("User not found");

    // remove from requests
    user.requests = user.requests.filter(
      (id) => id.toString() !== requesterId
    );

    // add to followers
    user.followers.push(requesterId);

    // add to following of requester
    requester.following.push(user._id);

    await user.save();
    await requester.save();

    res.json("Request Accepted");
  } catch (err) {
    res.status(500).json("Server error");
  }
});


// Reject Follow Request
router.post("/:id/reject-request", async (req, res) => {
  try {
    const { requesterId } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json("User not found");

    user.requests = user.requests.filter(
      (id) => id.toString() !== requesterId
    );

    await user.save();

    res.json("Request Rejected");
  } catch (err) {
    res.status(500).json("Server error");
  }
});


// Get Follow Requests
router.get("/:id/requests", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("requests", "username profilePic");

    if (!user) return res.status(404).json("User not found");

    res.json(user.requests);
  } catch (err) {
    res.status(500).json("Server error");
  }
});

// Update User
router.put("/:id", async (req, res) => {
    if (req.body.userId !== req.params.id)
        return res.status(403).json("You can update only your account");

    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    name: req.body.name,
                    username: req.body.username,
                    bio: req.body.bio,
                    profilePic: req.body.profilePic,
                },
            },
            { new: true }
        );

        res.json(updatedUser);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Update Profile Picture
router.put("/:id/profile-pic", upload.single("file"), async (req, res) => {
    console.log("update profile pic hit");

    try {
        if (!req.file) return res.status(400).json("No file uploaded");

        // --- DELETE OLD PIC (if not default) ---
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json("User not found");

        if (user.profilePic.includes("freepik.com")) {
            console.log("yes han default pic hai ye");

        }

        // --- DELETE OLD PIC (if not default) ---
        if (user.profilePic && !user.profilePic.includes("freepik.com")) {
            const publicId = user.profilePic.split("/").pop().split(".")[0];
            if (publicId) {
                await cloudinary.uploader.destroy(publicId);
            }
        }

        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: "image" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { profilePic: result.secure_url } },
            { new: true }
        );


        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Delete Profile Picture
router.delete("/:id/profile-pic", async (req, res) => {
    console.log("delete profile pic hit");

    try {
        const DEFAULT_PIC = "https://img.freepik.com/premium-vector/vector-flat-illustration-grayscale-avatar-user-profile-person-icon-gender-neutral-silhouette-profile-picture-suitable-social-media-profiles-icons-screensavers-as-templatex9xa_719432-2210.jpg?semt=ais_hybrid&w=740&q=80";

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { profilePic: DEFAULT_PIC } },
            { new: true }
        );

        res.status(200).json(updatedUser);

    } catch (err) {
        res.status(500).json(err);
    }
});

// Update Privacy
router.put("/:id/privacy", async (req, res) => {
    console.log("update privacy hit");
    
    try {
        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { isPrivate: req.body.isPrivate },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json(err);
    }
});

// update password
router.put("/:id/change-password", async (req, res) => {
    console.log("change password hit");
    try {
        const { oldPass, newPass } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json("User not found");
        

        const isMatch = await bcrypt.compare(oldPass, user.password);        
        if (!isMatch) {
            console.log("Old password incorrect");
            return res.status(400).json("Old password incorrect");
        }

        const hashed = await bcrypt.hash(newPass, 10);

        user.password = hashed;
        await user.save();

        res.json("Password updated");
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


// Get self profile
router.get("/:id", async (req, res) => {
    console.log('get self user hit');
    try {
        const user = await User.findById(req.params.id).populate("posts");
        console.log('user sent', user.username);

        const { password, updatedAt, ...other } = user._doc;
        res.status(200).json(other);
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET suggested users
router.get("/suggested/:id", async (req, res) => {
    console.log('get suggested hit');
    
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json("User not found");

        const following = user.following; // array of IDs
        const requested = user.followRequestsSent || []; // optional

        const excludeIds = [...following, ...requested, user._id];

        const suggested = await User.find({
            _id: { $nin: excludeIds },
        }).limit(20);
        
        res.json(suggested);
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET other user profile
router.get("/:id/:viewerId", async (req, res) => {
    console.log('get other user profile hit');
    try {
    const user = await User.findById(req.params.id)
      .populate("posts")
      .populate("followers", "username profilePic")
      .populate("following", "username profilePic");

    if (!user) return res.status(404).json("User not found");

    const viewerId = req.params.viewerId;

    const isFollowing = user.followers.some(
      (f) => f._id.toString() === viewerId
    );

    // If private and viewer not following → send limited profile
    if (user.isPrivate && !isFollowing && viewerId !== user._id.toString()) {
      return res.json({
        _id: user._id,
        username: user.username,
        bio: user.bio,
        profilePic: user.profilePic,
        isPrivate: user.isPrivate,
        restricted: true, 
      });
    }

    // Otherwise send full profile
    res.json({ ...user.toObject(), restricted: false });
  } catch (err) {
    res.status(500).json(err);
  }
});


export default router;
