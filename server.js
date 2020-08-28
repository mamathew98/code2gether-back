require("rootpath")();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("_helpers/jwt");
const errorHandler = require("_helpers/error-handler");
const http = require("http").Server(app);
const io = require("socket.io")(http);

io.origins('*:*');

const documentService = require("./documents/document.service.js");
const userService = require("./users/user.service");

const documents = {};

io.on("connection", async (socket) => {
  // console.log(documents);
  // console.log(socket);

  let previousId;
  const safeJoin = (currentId) => {
    socket.leave(previousId);
    socket.join(currentId);
    previousId = currentId;
  };

  socket.on("getDoc", async (docId) => {
    // console.log(documents);

    fetchedDoc = await documentService.getDocById(docId);
    safeJoin(docId);
    socket.emit("document", fetchedDoc);
  });

  socket.on("addDoc", async (doc) => {
    // console.log(documents);

    documentService.createDoc(doc);
    userService.addProject(doc.owner, doc.id);
    // documents[doc.id] = doc;
    safeJoin(doc.id);
    docs = await documentService.getAllDocs();
    console.log("added: ", docs);
    io.emit("documents", docs);
    socket.emit("document", doc);
  });

  socket.on("editDoc", async (doc) => {
    // console.log(documents);

    await documentService.saveDoc(doc.id, doc);
    // documents[doc.id] = doc;
    socket.to(doc.id).emit("document", doc);
  });

  socket.on("deleteDoc", async(username, docId) => {
    deleted = documentService.deleteDoc(username, docId)
    if(deleted){
      io.sockets.clients(docID).array.forEach(element => {
        element.leave(docId)
      });
    }
  })

  docs = await documentService.getAllDocs();
  console.log("all: ", docs);
  io.emit("documents", docs);
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({origin: "*",
  allowedHeaders:['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']}));
// use JWT auth to secure the api
app.use(jwt());

// api routes
app.use("/users", require("./users/users.controller"));
app.use("/projects", require("./documents/docment.controller"))

// global error handler
app.use(errorHandler);

// start server
// const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
const port = 4000;
const server = http.listen(port, function () {
  console.log("Server listening on port " + port);
});
