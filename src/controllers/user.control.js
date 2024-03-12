import { asyncHandler } from "../utils/Async_handler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { uplodOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
const genarateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.genarateAccessToken();
        const refreshToken = user.genarateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while genarateAccessToken and Refresh Token.");
    }
}
const registerUser = asyncHandler(async (req, res) => {
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

    const { fullName, email, username, password } = req.body
    //    console.log(req.body)
    // console.log("email :",email);


    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fielda are required.");
    }

    const existedUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    const avatarLocalpath = req.files?.avatar[0]?.path;
    // const coverImageLocalpath = req.files?.coverImage[0]?.path;
    let coverImageLocalpath;
    if (req.files && Array.isArray(req.files.coverImage) && req.coverImage.length > 0) {
        coverImageLocalpath = req.files.coverImage[0].path
    }
    if (!avatarLocalpath) {
        throw new ApiError(400, "Avatar is required.");
    }


    const avatar = await uplodOnCloudinary(avatarLocalpath);
    const coverImage = await uplodOnCloudinary(coverImageLocalpath);
    if (!avatar) {
        throw new ApiError(400, "Avatar is required in cloudinary.");
    }

    const user = await User.create({
        fullName,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while register the user.");
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser, "User registered successfully.")
    )
});
const loginUser = asyncHandler(async (req, res) => {
    //take userName or gmail : req.body.
    //find the user.
    //check the password.
    //access and refresh token.
    //send to the cookies.
    const { username, email, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "email or userName is required.");
    }


    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user) {
        throw new ApiError(404, "User does not exsit.");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect.");
    }

    const { accessToken, refreshToken } = await genarateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly:true,
        secure:true
    }
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(
        new ApiResponse(
            200,{
                data:loggedInUser,accessToken,refreshToken
            },
            "user logedIn successfully"
        )
     )






})

const logoutUser = asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new :true
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User loggedout successfully."))
})

export {
    registerUser,
    loginUser,
    logoutUser
};
