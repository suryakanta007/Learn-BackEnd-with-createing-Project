import { asyncHandler } from "../utils/Async_handler.js";
import {ApiError} from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import {uplodOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/apiResponse.js";

const registerUser = asyncHandler(async(req,res)=>{
   //get user Details from user.
   //validation: check any field is empty or not .
   //check the user is exsit or not :usreName,email.
   //check for  the user image or avatar .
   // upload them into cloudinary.avatar
   //check responce from the cloudinary and take the url.
   //create object of the info : create entery in DB.
   //check remove the password and refreshtoken from the responce.
   //check the responce : user for user creation 
   // send responce.

   const{fullName,email,username,password}=req.body
    console.log("email :",email);


    if([fullName,email,username,password].some((field)=> field?.trim()==="")){
        throw new ApiError(400,"All fielda are required.");
    }

    const existedUser = User.findOne({$or:[email,username]});
    if(existedUser){
        throw new ApiError(409,"User already exists");
    }

    const avatarLocalpath = req.files?.avatar[0]?.path;
    const coverImageLocalpath = req.files?.coverImage[0]?.path;
    if(!avatarLocalpath){
        throw new ApiError(400,"Avatar is required.");
    }

    
    const avatar = await uplodOnCloudinary(avatarLocalpath);
    const coverImage = await uplodOnCloudinary(coverImageLocalpath);
    if(!avatar){
        throw new ApiError(400,"Avatar is required in cloudinary.");
    }

    const user  = await User.create({
        fullName,
        email,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refresToken"
    );

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while register the user.");
    }

    return res.status(200).json(
        new ApiResponse(200,createdUser,"User registered successfully.")
    )
})

export {registerUser};
