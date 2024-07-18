const express = require('express');
const fileUpload = require('express-fileupload');
const convertDocBookToDITA = require("./index")
const app = express();
require("dotenv").config({ path: "./.env" });
const PORT = process.env.PORT || 8000;
const path = require("path");
const fs = require('fs');
const shell = require("shelljs");
const cors = require('cors');
// const { getInputFileName} = require('./utils/StateManagement');
const AdmZip = require('adm-zip');
// const jwt = require("jsonwebtoken");
// const User = require("./models/userModel");
// const fileHistory = require("./models/fileHistoryModel");
// const bcrypt = require('bcrypt');
// const connectDB = require("./database/db");
// const authenticateToken = require("./middleware/authentication.js");
// const jwt_secret = process.env.JWT_SECRET;
// const useragent = require("useragent");
// const geoip = require("geoip-lite");
// const ip = require("ip")
// const JSZip = require('jszip');
const { DOMParser } = require('xmldom');
const { promisify } = require('util');
const { getInputFileName,setInputFileName} = require('./utils/StateManagement');
const readdirAsync = promisify(fs.readdir);

let inputDocxFile = path.join(__dirname, `../inputs/`);
const outputFile = path.join(__dirname, "../output");
const downloadFile = path.join(__dirname, "../downloads");
app.use(fileUpload());
app.use(cors())
app.use(express.json());

app.post('/api/upload', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send({ error: 'No files were uploaded.' });
    }
    const docxFile = req.files.file;
    const uniqueFilename = `${docxFile.name}`;
    const filePath = path.join(__dirname, `../inputs/${uniqueFilename}`);
    await docxFile.mv(filePath);
    await cleanInputDirectory(filePath);
    res.status(200).send({ message: `File "${uniqueFilename}" uploaded successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'An unexpected error occurred.' });
  }
});


// app.get('/api/convertDcbToDita', async (req, res) => {
//   const obj = {
//     downloadLink: "",
//     outputId: "",

//   }
//   try {
//     fs.readdir(inputDocxFile, async (err, files) => {
//       if (err) {
//         console.error('Error reading folder:', err);
//         return;
//       }
//       for (const file of files) {
//         const filePath = path.join(inputDocxFile, file);
//         let fileName = path.parse(path.basename(filePath)).name + ".zip";
//         setInputFileName(fileName)
//         const {outputId,downloadLink}= await convertDocBookToDITA(filePath);
//         obj.downloadLink = downloadLink;
//         obj.outputId = outputId;
//       }
//       const outputFolderPath = outputFile;
//      const outputPath = path.join(outputFolderPath,obj.outputId);

//       if (!outputPath) {
//         return res.status(400).send('Folder path is required.');
//       }
//       fs.readdir(outputFile, (err, files) => {
//         if (err) {
//           console.error('Error reading output folder:', err);
//           return;
//         }
//         files.forEach(file => {
//           let folderPath = path.join(outputFile, file)
//           if (file !== obj.outputId) {
//             cleanupUploadedZip(folderPath);
//           }
//         });
//       });
//       res.status(200).json({
//         message: 'Files converted successfully.',
//         downloadLink: obj?.downloadLink,
//         status: 200,
//       });
//     })
//   } catch (error) {
//     console.error("Error converting DOCX to DITA:", error.message);
//     res.status(500).send("Internal server error.");
//   }
// });



app.get('/api/convertDcbToDita', async (req, res) => {
  const obj = {
    downloadLink: "",
    outputId: "",

  }
  try {
    fs.readdir(inputDocxFile, async (err, files) => {
      if (err) {
        console.error('Error reading folder:', err);
        return;
      }
      for (const file of files) {
        const filePath = path.join(inputDocxFile, file);
        let fileName = path.parse(path.basename(filePath)).name + ".zip";
        setInputFileName(fileName)
        const a= await convertDocBookToDITA(filePath);
        // obj.downloadLink = downloadLink;
        // obj.outputId = outputId;
      }
    //   const outputFolderPath = outputFile;
    //  const outputPath = path.join(outputFolderPath,obj.outputId);

      // if (!outputPath) {
      //   return res.status(400).send('Folder path is required.');
      // }
      // fs.readdir(outputFile, (err, files) => {
      //   if (err) {
      //     console.error('Error reading output folder:', err);
      //     return;
      //   }
      //   files.forEach(file => {
      //     let folderPath = path.join(outputFile, file)
      //     if (file !== obj.outputId) {
      //       cleanupUploadedZip(folderPath);
      //     }
      //   });
      // });
      res.status(200).json({
        message: 'Files converted successfully.',
        downloadLink: obj?.downloadLink,
        status: 200,
      });
    })
  } catch (error) {
    console.error("Error converting DOCX to DITA:", error.message);
    res.status(500).send("Internal server error.");
  }
});








app.get('/api/download/:downloadId', async (req, res) => {
  const downloadId = req.params.downloadId;
  const uploadsDir = path.join(outputFile, downloadId);

  fs.readdir(uploadsDir, 'utf8', async (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return res.status(500).send('Error reading directory');
    }
    if (files.length === 0) {
      return res.status(404).send('No files found to download');
    }
    // let fileName=path.join(inputDocxFile)
    let fileName = getInputFileName();
    const outputZipPath = path.join(downloadFile, `${fileName}`);
    const zip = new AdmZip();
   
    zip.addLocalFolder(uploadsDir);
    zip.writeZip(outputZipPath);

    res.download(outputZipPath, `${fileName}`, async (err) => {
      if (err) {
        console.error('Error during download:', err);
        res.status(500).send('Error during download');
      } else {
        fs.unlinkSync(outputZipPath);
        await cleanupUploadedZip(uploadsDir);
      }
    });
  });
});

// app.post("/api/register", async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Generate a salt
//     const salt = await bcrypt.genSalt(10);
//     // Hash the password with the salt
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create a new user with the hashed password
//     const user = new User({ email, password: hashedPassword });

//     await user.save();
//     res.status(201).json({ message: "User registered", status: 201 });
//   } catch (error) {
//     res.status(400).json({ message: "User registration failed", status: 400 });
//   }
// });


// app.post("/api/fileHistory", authenticateToken, async (req, res) => {
//   const fileName = path.join(__dirname, './inputs/');
//   fs.readdir(fileName, async (err, files) => {
//     if (err) {
//       console.error('Error reading folder:', err);
//       return res.status(500).json({ message: "Error reading folder", status: 500 });
//     }

//     const userId = req.user.userId;
//     const info = await User.findById(userId);

//     if (!info) {
//       return res.status(404).json({ message: "User not found", status: 404 });
//     }

//     const ipAddress = ip.address();
//     const agent = useragent.parse(req.headers["user-agent"]);
//     const geo = geoip.lookup(ipAddress);

//     try {
//       for (const file of files) {
//         let data = {
//           fileName: file,
//           userId: userId,
//           email: info.email,
//           os: agent.os.toString(),
//           ip: ipAddress,
//           location: geo ? { country: geo.country, city: geo.city } : {},
//           browser: agent.toAgent()
//         };

//         const fileHistoryRecord = await fileHistory.create(data);

//         if (fileHistoryRecord) {
//           res.status(201).json({ message: "File history recorded successfully 🎉", status: 201 });
//         } else {
//           console.error('File history record creation failed');
//         }
//       }


//     } catch (error) {
//       console.error('Error creating file history record:', error);
//       res.status(500).json({ message: "Internal server error", status: 500 });
//     }
//   });
// });




// app.post("/api/login", async (req, res) => {

//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email });

//     if (user) {
//       const isPasswordValid = await bcrypt.compare(password, user.password);
// console.log(isPasswordValid)
//       if (isPasswordValid) {
   
//         const token = jwt.sign({ userId: user._id }, jwt_secret, { expiresIn: "2h" });
      
//         req.token = token
//         return res.status(200).json({ message: "Login successful 🎉", status: 200, token });
//       }
//     }

//     res.status(401).json({ message: "Login failed", status: 401 });
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error", status: 500 });
//   }
// });


// app.post("/api/login", async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });

//     if (!user){
//       return res.status(401).json({ message: "Login failed: User not found", status: 401 });
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password);

//     if (!isPasswordValid) {
//       return res.status(401).json({ message: "Login failed: Incorrect password", status: 401 });
//     }

//     const token = jwt.sign({ userId: user._id }, jwt_secret, { expiresIn: "2h" });

//     return res.status(200).json({ message: "Login successful 🎉", status: 200, token });
//   } catch (error) {
//     console.error("Login error:", error);
//     return res.status(500).json({ message: "Internal server error", status: 500 });
//   }
// });


app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
//   connectDB();
});
async function cleanupUploadedZip(FolderDir) {
  try {
    if (fs.existsSync(FolderDir)) {
      shell.rm("-rf", FolderDir);
      console.log("Successfully cleaned up uploaded zip file:", FolderDir);
    } else {
      console.log("Directory does not exist:", FolderDir);
    }
  } catch (error) {
    console.error("Error cleaning up uploaded zip file:", error);
  }
}

async function cleanInputDirectory(filePath) {
  const directory = path.dirname(filePath);
  try {
    const files = await fs.promises.readdir(directory);
    for (const file of files) {
      if (file !== path.basename(filePath)) {
        const fullPath = path.join(directory, file);
        await fs.promises.unlink(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error cleaning input directory: ${err.message}`);
  }
}





// async function checkDocxStartsWithHeading(filePath) {
//   const content = fs.readFileSync(filePath, 'binary');
//   const zip = await JSZip.loadAsync(content);
//   const docXml = await zip.file('word/document.xml').async('string');

//   const parser = new DOMParser();
//   const xmlDoc = parser.parseFromString(docXml, 'application/xml');

//   const namespaces = {
//     w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
//   };

//   const paragraphs = xmlDoc.getElementsByTagNameNS(namespaces.w, 'p');

//   if (paragraphs.length > 0) {
//     const firstParagraph = paragraphs[0];
//     const pStyle = firstParagraph.getElementsByTagNameNS(namespaces.w, 'pStyle')[0];

//     if (pStyle) {
//       const styleVal = pStyle.getAttribute('w:val');
//       if (styleVal) {
//         const styleValLower = styleVal.toLowerCase();
//         return ['title', 'tocheading', 'heading1'].includes(styleValLower);
//       }
//     }
//   }
//   return false;
// }
// app.post('/api/checkPreflight', async (req, res) => {
//   const filePath = path.join(__dirname, './inputs/');

//   try {
//     const files = await fs.promises.readdir(filePath);

//     if (files.length === 0) {
//       return res.status(400).json({ message: "No files found in the folder", status: 400 });
//     }
//     for (const file of files) {
//       const fullPath = path.join(filePath, file);
//       try {
//         const result = await checkDocxStartsWithHeading(fullPath);

//         if (result) {
//           return res.status(200).json({ message: "ok", status: 200, result: result });
//         } else {
//           return res.status(400).json({ message: "Input source does not contain valid style like title", status: 400 });
//         }
//       } catch (err) {
//         return res.status(500).json({ message: err.message, status: 500 });
//       }
//     }

//   } catch (err) {
//     return res.status(500).json({ message: "Error reading folder", status: 500 });
//   }
// });

