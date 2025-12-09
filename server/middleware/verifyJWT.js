import jwt from "jsonwebtoken";

export default function verifyJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id || payload.userId || payload._id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
