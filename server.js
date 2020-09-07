require("rootpath")();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("_helpers/jwt");
const errorHandler = require("_helpers/error-handler");
const http = require("http").Server(app);
const io = require("socket.io")(http);

io.origins("*:*");

const documentService = require("./documents/document.service.js");
const userService = require("./users/user.service");

const documents = {};
const cursors = {}; //save monaco editor name contentWidgets
const decorations = {};

function initCursor(username, docID) {
  const randomColor = "#" + Math.floor(Math.random() * 16777214 - 1).toString(16);
  if (cursors[docID] == undefined) {
    cursors[docID] = [];
  }
  var index = cursors[docID].findIndex((x) => x.id == username);
  if (index === -1) {
    cursors[docID].push({
      id: username,
      color: randomColor,
      html: {
        lineNumber: 1,
        column: 1,
      },
      css: {
        lineNumber: 1,
        column: 1,
      },
      js: {
        lineNumber: 1,
        column: 1,
      },
    });
  }
}

function updateCursor(username, docID, htmlPos, cssPos, jsPos) {
  if (cursors[docID] == undefined) {
    cursors[docID] = [];
  }
  var index = cursors[docID].findIndex((x) => x.id == username);
  if (index !== -1) {
    cursors[docID][index] = {
      id: username,
      html: htmlPos,
      css: cssPos,
      js: jsPos,
      color: cursors[docID][index].color,
    };
  } else {
    initCursor(username, docID);
  }
}

function deleteCursor(username, docID) {
  if (cursors[docID]) {
    var index = cursors[docID].findIndex((x) => x.id == username);
    if (index !== -1 && index) {
      cursors[docID].splice(index, 1);
    }
  }
}

io.on("connection", async (socket) => {
  // console.log(documents);
  // console.log(socket);
  let previousId;
  const safeJoin = async (currentId, username) => {
    socket.leave(previousId);
    await deleteCursor(username, previousId);
    io.in(previousId).emit("cursors", cursors[previousId]);
    io.in(previousId).emit("disconnect", username)
    socket.join(currentId);
    initCursor(username, currentId);
    previousId = currentId;
  };

  socket.on("leave", async (data) => {
    await deleteCursor(data.username, data.docID);
    io.in(data.docID).emit("cursors", cursors[data.docID]);
    io.in(data.docID).emit("disconnect", data.username)
  })
  //hey
  socket.on("getDoc", async (data) => {
    // console.log(documents);
    fetchedDoc = await documentService.getDocById(data.docId);
    safeJoin(data.docId, data.username);
    socket.emit("document", fetchedDoc);
    socket.emit("cursors", cursors[data.docId]);
  });

  socket.on("addDoc", async (doc) => {
    // console.log(documents);

    documentService.createDoc(doc);
    userService.addProject(doc.owner, doc.id);
    // documents[doc.id] = doc;
    safeJoin(doc.id, doc.owner);
    docs = await documentService.getAllDocs();
    // console.log("added: ", docs);
    io.emit("documents", docs);
    socket.emit("document", doc);
  });

  socket.on("editDoc", async (document) => {
    // console.log(documents);
    console.log("CURSORS : ", cursors[document.id]);

    await documentService.saveDoc(document.id, document);
    // documents[doc.id] = doc;
    socket.to(document.id).emit("document", document);
    io.in(document.id).emit("cursors", cursors[document.id]);
  });

  socket.on("updateCursor", async (data) => {
    updateCursor(
      data.username,
      data.docID,
      data.htmlPos,
      data.cssPos,
      data.jsPos
    );
    io.in(data.docID).emit("cursors", cursors[data.docID]);
  });

  socket.on("deleteDoc", async (username, docId) => {
    deleted = documentService.deleteDoc(username, docId);
    if (deleted) {
      io.sockets.clients(docID).array.forEach((element) => {
        element.leave(docId);
      });
    }
  });

  docs = await documentService.getAllDocs();
  // console.log("all: ", docs);
  io.emit("documents", docs);
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);
// app.use(cors())
// use JWT auth to secure the api
app.use(jwt());

// api routes
app.use("/users", require("./users/users.controller"));
app.use("/projects", require("./documents/docment.controller"));

// global error handler
app.use(errorHandler);

// start server
// const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
const port = 4000;
const server = http.listen(port, function () {
  console.log("Server listening on port " + port);
});
