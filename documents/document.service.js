const config = require("config.json");

const db = require("_helpers/db");
const userService = require("../users/user.service");
const Doc = db.Doc;
const User = db.User;

module.exports = {
  createDoc,
  getAllDocs,
  getDocById,
  getUserDocs,
  saveDoc,
  deleteDoc,
};

async function createDoc(docParams) {
  const doc = new Doc(docParams);
  await doc.save();
}

async function getAllDocs() {
  return await Doc.find();
}

async function getDocById(id) {
  return await Doc.findOne({ id: id });
}

async function getUserDocs(username) {
  console.log("service called");
  const pidArr = await userService.getProjects(username);
  return await Doc.find({ id: { $in: pidArr } });
}

async function deleteDoc(username, id) {
  const user = await User.findOne({ username: username });
  const users = await User.find();
  const project = await Doc.findOne({id: id})
  console.log(user);
  if (project.owner === username) {
    await Doc.findOneAndRemove({ id: id });
    users.forEach(element => {
      const index = element.projects.indexOf(id);
      if (index > -1) {
        element.projects.splice(index, 1);
        element.save();
      }
    });
    return true;
  } else {
    const index = user.projects.indexOf(id);
    if (index > -1) {
      user.projects.splice(index, 1);
    }
    user.save();
    return false
  }
}

async function saveDoc(id, docParams) {
  const doc = await Doc.findOne({ id: id });
  console.log(doc);
  if (!doc) {
    throw new Error("Document Not Found!");
  }
  Object.assign(doc, docParams);
  await doc.save();
}
