import multer from "multer";


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./Public/Temp")
    },
    filename: function (req, file, cb) {
      //make console the file for better under satnd
    //   console.log(file)
      cb(null, file.originalname)//for better you can save in file in unique file name.
    }
  })
  
 export const upload = multer({ 
    storage: storage 
})