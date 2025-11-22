import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Follow User
router.put("/:id/follow", async (req, res) => {
    if (req.body.userId !== req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);

            if (!user.followers.includes(req.body.userId)) {
                if (user.isPrivate) {
                    if (!user.requests.includes(req.body.userId)) {
                        await user.updateOne({ $push: { requests: req.body.userId } });
                        res.status(200).json("Follow request has been sent");
                    } else {
                        res.status(403).json("You already requested to follow this user");
                    }
                } else {
                    await user.updateOne({ $push: { followers: req.body.userId } });
                    await currentUser.updateOne({ $push: { following: req.params.id } });
                    res.status(200).json("User has been followed");
                }
            } else {
                res.status(403).json("You already follow this user");
            }
        } catch (err) {
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
router.put("/:id/accept", async (req, res) => {
    try {
        const user = await User.findById(req.params.id); // The user accepting the request
        const requester = await User.findById(req.body.userId); // The user who sent the request

        if (user.requests.includes(req.body.userId)) {
            await user.updateOne({ $push: { followers: req.body.userId } });
            await requester.updateOne({ $push: { following: req.params.id } });
            await user.updateOne({ $pull: { requests: req.body.userId } });
            res.status(200).json("Follow request accepted");
        } else {
            res.status(403).json("No follow request from this user");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// Reject Follow Request
router.put("/:id/reject", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user.requests.includes(req.body.userId)) {
            await user.updateOne({ $pull: { requests: req.body.userId } });
            res.status(200).json("Follow request rejected");
        } else {
            res.status(403).json("No follow request from this user");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get Follow Requests
router.get("/:id/requests", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate("requests", "username profilePic");
        res.status(200).json(user.requests);
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
