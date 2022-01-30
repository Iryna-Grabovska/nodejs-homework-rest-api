const { Schema, model } = require("mongoose");
const Joi = require("joi");

const contactSchema = Schema(
  {
    name: {
      type: String,
      required: [true, "Set name for contact"],
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false, timestamps: true }
);

const joiContactSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.number().required(),
  email: Joi.string().required(),
  favorite: Joi.bool(),
});

const joiUpdateFavoriteSchema = Joi.object({
  active: Joi.boolean().required(),
});

const Contact = model("contact", contactSchema);
module.exports = {
  Contact,
  schemas: {
    joiContactSchema,
    joiUpdateFavoriteSchema,
  },
};
