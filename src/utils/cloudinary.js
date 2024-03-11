import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uplodOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath){
            return null;
        }
        // uplode in cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //the file has been uploded successfully.
        // console.log(response);
        // console.log("File is Uploded in cloudinary successfully.",response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)//revome the locally saved tempary file as as the opearion got failed
        return null;
    }
}

export {uplodOnCloudinary};
