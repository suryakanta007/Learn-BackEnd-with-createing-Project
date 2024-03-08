import { Router} from "express";
import { registerUser } from "../controllers/user.control.js";

const router  = Router();
router.route("/register").post(registerUser);


export default Router;