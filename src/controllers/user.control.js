import { asyncHandler } from "../utils/Async_handler.js";

const registerUser = asyncHandler(async(req,res)=>{
    res.status(200).json({
        message:"Ok"
    })
})

export {registerUser};
