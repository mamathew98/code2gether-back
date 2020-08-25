const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DocSchema = new Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String },
  html: { type: String },
  css: { type: String },
  js: { type: String },
  owner: {type: String}
});


module.exports = mongoose.model("Doc", DocSchema);
