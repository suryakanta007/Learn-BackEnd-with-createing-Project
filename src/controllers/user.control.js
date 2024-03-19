import { asyncHandler } from "../utils/Async_handler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { uplodOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import Jwt from "jsonwebtoken";
const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
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
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
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

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, {
                data: loggedInUser, accessToken, refreshToken
            },
                "user logedIn successfully"
            )
        )






})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User loggedout successfully."))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, " Unauthorized Request");
    }

    try {
        const decodedToken = Jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalied Refresh Token.");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is Expired or used.");
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(201, {
                    accessToken, refreshToken: newRefreshToken
                }, "AccessToken Refreshed Successfully"
                )
            )


    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token.");
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Your oldPassword is not correct.");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Your password has changed successfully.")
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(202, req.user, "Current user feached successfully")
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(401, "All fields are required.");
    }

    const user = User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true })
        .select("-password");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User details updated successfully.")
        );
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing.");
    }

    const avatar = await uplodOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(500, "avatar url is missing from cloudinary.");
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }).select("-password")
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar is updated successfully.")
        );
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage file is missing.");
    }

    const coverImage = await uplodOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(500, "coverImage url is missing from cloudinary.");
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }).select("-password")
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "CoverImage is updated successfully.")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing.");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },{
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond: {
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"channel does not exit.")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"User channel feached successfully."));
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
};
