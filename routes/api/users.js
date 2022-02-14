const express = require("express");
const path = require("path");
const fs = require("fs/promises");

const { User } = require("../../models/user");
const { authenticate, upload } = require("../../middlewares");

const router = express.Router();

router.get("/current", authenticate, async (req, res, next) => {
  res.json({
    email: req.user.email,
  });
});

router.get("/logout", authenticate, async (req, res, next) => {
  const { _id } = req.user;
  await User.findOneAndUpdate(_id, { token: "" });
  res.status(204).send();
});

const avatarDir = path.join(__dirname, "../../", "public", "avatars");
router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  async (req, res, next) => {
    const { _id } = req.user;
    const { path: tempUpload, filename } = req.file;
    try {
      const [extention] = filename.split(".").reverse();
      const newFileName = `${_id}.${extention}`;
      const resultUpload = path.join(avatarDir, newFileName);
      await fs.rename(tempUpload, resultUpload);
      const avatarUrl = path.join("avatars", newFileName);
      await User.findByIdAndUpdate(_id, { avatarUrl });
      res.json({ avatarUrl });
    } catch (error) {}
  }
);

module.exports = router;
