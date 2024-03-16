import { Router} from "express";
import { loginUser, logoutUser, registerUser,refreshAccessToken } from "../controllers/user.control.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.midelware.js";

const router  = Router();
router.route("/register").post(
    upload.fields([
        {name:"avatar",
        maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ])
    ,registerUser
    );
    router.route("/login").post(loginUser)

    //Secured routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken);    


export default router;