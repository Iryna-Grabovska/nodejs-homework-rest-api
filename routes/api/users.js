const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const createError = require("http-errors");

const { User, schemas } = require("../../models/user");
const { authenticate, upload } = require("../../middlewares");
const { sendMail } = require("../../helpers");

const router = express.Router();

router.get("/verify/:verificationToken", async (req, res, next) => {
  try {
    const { veriricatonToken } = req.params;
    const user = await User.findOne({ veriricatonToken });
    if (!user) {
      throw createError(404);
    }
    await User.findByIdAndUpdate(user._id, {
      verify: true,
      veriricatonToken: "",
    });
    res.json({
      message: "Verification successful",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/verify", async (req, res, next) => {
  try {
    const { error } = schemas.verify.validate(req.body);
    if (error) {
      throw createError(400, "missing required field email");
    }
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user.verify) {
      throw createError(400, "Verification has already been passed");
    }
    const mail = {
      to: email,
      subject: "Подтверждения пароля",
      html: `<a href='http://localhost:3000/api/users/${user.verificationToken}'>Нажмите чтобы подтвердить свою почту </a>`,
    };
    sendMail(mail);
    res.json({
      message: "Verification email sent",
    });
  } catch (error) {
    next(error);
  }
});

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
