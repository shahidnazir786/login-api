const express = require("express");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const app = express();
app.use(express.json());
const secKey = "shhhh";
app.use("/uploads", express.static(path.join(__dirname + "uploads")));

const users = [
  { email: "a@gmail.com", password: "111" },
  { email: "b@gmail.com", password: "222" },
  { email: "c@gmail.com", password: "333" },
  { email: "d@gmail.com", password: "444" },
  { email: "e@gmail.com", password: "555" },
  { email: "f@gmail.com", password: "666" },
];

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(
    (item) => item.email === email && item.password === password
  );

  if (!user) {
    return res.status(400).send("Incorrect email or password");
  } else {
    const token = jwt.sign({ email: user.email }, secKey);
    return res.send({
      message: "Login Successfully!",
      token,
      user,
    });
  }
});

const data = multer({
  storage: multer.diskStorage({
    destination: async function (req, file, cb) {
      let dir = "./uploads/" + req.email;
      if (!fs.existsSync(dir)) {
        await fs.mkdirSync(dir, { recursive: true }, (err) => {});
        cb(null, dir);
      }
    },

    filename: function (req, file, cb) {
      let extension = file.originalname.split(".");
      cb(null, file.fieldname + "-" + Date.now() + "." + [extension[1]]);
    },
  }),
});

app.post("/upload", isLoggedIn, data.single("avatar"), (req, res) => {
  res.status(200).json({
    message: "Image Upload!",
  });
});

app.get("/getImage", isLoggedIn, (req, res) => {
  const fPath = "./uploads/" + req.email;
  let filess = fs.readdir(fPath, (err, files) => {
    if (err) {
      return res.status(401).json({
        message: "Not Found",
      });
    } else {
      return res.status(200).json({
        files,
      });
    }
  });
});

app.delete("/deleteImage", isLoggedIn, (req, res) => {
  fs.mkdir("/uploads" + req.email, { recursive: true }, (err, data) => {
    if (err) {
      return res.status(500).json({
        message: "No Data Found",
      });
    }
    return res.status(200).json({
      message: "Delete Sucessfully!",
    });
  });
});

function isLoggedIn(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(400).send("Error");
  } else {
    jwt.verify(authHeader, secKey, (err, data) => {
      if (data.email) {
        req.email = data.email;
        next();
      } else {
        res.status(401).json({ err });
      }
    });
  }
}

const port = 3000;
app.listen(port, () => console.log(`Server Working on ${port}`));
