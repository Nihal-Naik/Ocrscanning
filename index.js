const Tesseract=require('node-tesseract-ocr')
const express=require('express')
const pdfparse=require('pdf-parse')
const isPDF=require('is-pdf-valid')
const multer=require('multer')
const admin=require("firebase-admin")
const credentials=require('./key.json')
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const port=2000
const app=express()

app.set("view engine","hbs")
admin.initializeApp({
    credential:admin.credential.cert(credentials),
    apiKey: "AIzaSyC2LMgMBrNJ7gHHrEX6RyEYkQU4qKZ0Li0",
    authDomain: "ocrsscanning.firebaseapp.com",
    projectId: "ocrsscanning",
    storageBucket: "ocrsscanning.appspot.com",
    messagingSenderId: "84958060156",
    appId: "1:84958060156:web:2acfade8c1f75226c073f9",
    measurementId: "G-M10BVMNLSV"
})
// const db=admin.firestore()
app.use(express.json())
app.use(express.urlencoded({extended:false}))

const upload = multer();

// Function to upload an image to Firebase Storage
async function uploadImageToFirebase(imageBuffer, OriginalFilename,contentType) {
  try {
    const bucket = admin.storage().bucket();
    // const imageUuid = uuidv4();
    const imageName = `images/${OriginalFilename}`;

    // Upload the image to Firebase Storage
    await bucket.file(imageName).save(imageBuffer, {
      metadata: {
        contentType: contentType
      },
    });

    // console.log('Image uploaded successfully!');
    return imageName; // Return the uploaded image's storage path
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}
app.get("/",(req,resp)=>{
    resp.render("index")
})

async function performOCR() {
  try {
    const config = {
      lang: 'eng', // Replace with the language code for the language used in the image (e.g., 'eng' for English)
    };
    const text = await Tesseract.recognize('https://storage.googleapis.com/tutorial-a9d4a.appspot.com/images/IvV2y.png', config);
    return text;
  } catch (error) {
    console.error('Error performing OCR:', error);
    throw error;
  }
}

app.get("/details",(req,resp)=>{
  resp.render('details')
})

app.post("/upload",upload.single('image') ,async(req,resp)=>{

    try {
        const imagePath = req.file.buffer;
        const OriginalFilename=req.file.originalname
        const contentType=req.file.mimetype
        const imageName = await uploadImageToFirebase(imagePath,OriginalFilename,contentType);
        // console.log(imageName);
        const imageUrl = `https://storage.googleapis.com/tutorial-a9d4a.appspot.com/${imageName}`;
        console.log(imageUrl);
        const ocrResult = await performOCR();
        console.log(ocrResult)
        resp.send(`Image uploaded successfully. Firebase Storage URL: ${imageUrl}`);
      } catch (error) {
        resp.status(500).send('Error uploading image: ' + error.message);
    }
    // const config = {
    //     lang: "eng",
    //   }
    //   tesseract
    //     .recognize("https://storage.googleapis.com/tutorial-a9d4a.appspot.com/images/IvV2y.png", config)
    //     .then((text) => {
    //       console.log("Result:", text)
    //       // if(text.match(/(^|\W)Times(^|\W)/i)){
    //       //   console.log("Word match")
    //       // }else{
    //       //   console.log("Word not match")
    //       // }
    //     })
    //     .catch((error) => {
    //       console.log(error.message)
    //     })
    
   
})

app.get('/check',(req,resp)=>{
  const axios = require('axios');

const storageUrl = 'https://storage.googleapis.com/ocrsscanning.appspot.com/images/milky-way-2695569_1280.jpg'; // Replace with the actual Firebase Storage URL

async function checkUrlAccessibility() {
  try {
    const response = await axios.head(storageUrl);

    if (response.status === 200) {
      console.log('The URL is publicly accessible.');
    } else {
      console.log('The URL is not publicly accessible. It may require authentication.');
    }
  } catch (error) {
    console.log('Error checking URL accessibility:', error.message);
  }
}

checkUrlAccessibility();
})
app.listen(port,()=>{
    console.log(`The server is running at ${port}`)
})









// const pdffile=fs.readFileSync('sample.pdf')
// console.log(isPDF(pdffile))
// pdfparse(pdffile).then(function(data){
//   // console.log(data.text)
//   if(data.text.match(/(^|\W)simples(^|\W)/i)){
//     console.log("Word found")
//   }else{
//     console.log("word not found")
//   }
// })