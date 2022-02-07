const express = require("express");
const createError = require("http-errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { User, schemas } = require("../../models/user.js");

const router = express.Router();

// const { SECRET_KEY } = process.env;
// console.log(SECRET_KEY);
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
    await User.create({ email, password: hashPassword });
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
