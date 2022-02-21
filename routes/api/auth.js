const express = require("express");
const createError = require("http-errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const { v4 } = require("uuid");

const { User, schemas } = require("../../models/user.js");
const { sendMail } = require("../../helpers");
const router = express.Router();
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post("/register", async (req, res, next) => {
  try {
    const { error } = schemas.register.validate(req.body);
    if (error) {
      // eslint-disable-next-line new-cap
      throw new createError(400, error.message);
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      // eslint-disable-next-line new-cap
      throw new createError("Email in use");
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const avatarUrl = gravatar.url(email);
    const verificationToken = v4();
    await User.create({
      email,
      avatarUrl,
      password: hashPassword,
      verificationToken,
    });
    const mail = {
      to: email,
      from: "mrsirynagrabovska@gmail.com",
      subject: "Подтверждения пароля",
      html: `<a href='http://localhost:3000/api/users/${verificationToken}'>Нажмите чтобы подтвердить свою почту </a>`,
    };
    await sendMail(mail);
    res.status(201).json({
      user: { email },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { error } = schemas.register.validate(req.body);
    if (error) {
      // eslint-disable-next-line new-cap
      throw new createError(400, error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // eslint-disable-next-line new-cap
      throw new createError(401, "Email or password is wrong");
    }
    if (!user.verify) {
      // eslint-disable-next-line new-cap
      throw new createError(401, "Email not verify");
    }
    const compareResult = await bcrypt.compare(password, user.password);
    if (!compareResult) {
      // eslint-disable-next-line new-cap
      throw new createError(401, "Email or password is wrong");
    }
    const payload = { id: user._id };

    const token = jwt.sign(
      payload,
      // SECRET_KEY,
      process.env.SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );
    await User.findOneAndUpdate(user._id, { token });
    res.json({
      token,
      user: { email },
    });
  } catch (error) {}
});

module.exports = router;
