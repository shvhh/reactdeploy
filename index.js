const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { execSync } = require("child_process");
const app = express();
// Serve static files from the 'build' directory
app.use(express.static(path.join(__dirname, "build")));
app.use(express.json());

const userInfo = ["amit", "mohit"];

app.post("/user/upload/:user", (req, res) => {
  if (!userInfo.includes(req.params.user)) {
    return res.status(500).json({ error: "Invalid user" });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + ".zip");
    },
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 10, // 10MB
    },
    fileFilter: function (req, file, cb) {
      if (!file.originalname.match(/\.(zip)$/)) {
        return cb(new Error("Invalid file"));
      }
      cb(null, true);
    },
  }).single("file");

  upload(req, res, function (err) {
    if (err) {
      return res.status(500).send(err);
    }
    if (fs.existsSync("build_old")) {
      fs.rmdirSync("build_old", { recursive: true });
    }
    // rename "build" directory to "build_old"
    fs.renameSync("build", "build_old");
    // Unzip the file
    execSync(`unzip ${req.file.filename}`);
    // check if the unzipped folder has a "build/index.html" file
    if (!fs.existsSync("build/index.html")) {
      // if not, rename "build_old" back to "build"
      fs.renameSync("build_old", "build");
      res.status(500).json({ error: "Invalid file" });
    } else {
      const data = fs.readFileSync("build/index.html", "utf8");
      if (
        !data.includes(
          "RigAlma-School Management System || Education Management System"
        )
      ) {
        fs.rmdirSync("build", { recursive: true });
        fs.renameSync("build_old", "build");
        res.status(500).json({ error: "Invalid file" });
      }
    }

    fs.rmSync(req.file.filename);
    if (fs.existsSync("build_old")) {
      fs.rmdirSync("build_old", { recursive: true });
    }
    if (!res.headersSent) {
      res.send("Uploaded Successfully");
    }
  });
});
// Handle any requests that don't match the above
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
