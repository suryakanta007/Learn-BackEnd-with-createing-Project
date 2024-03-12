import { Router} from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.control.js";
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
    Router.route("/login").post(loginUser)

    //Secured routes
Router.route("/logout").post(logoutUser)


export default router;