import jwt from "jsonwebtoken"
<<<<<<< HEAD
import { ENV } from "./env.js";

export const generateToken = (userID, res) => {
    const {JWT_SECRET} = ENV;
=======

export const generateToken = (userID, res) => {
    const {JWT_SECRET} = process.env;
>>>>>>> 457c702afcc6c769ce6866198198b0fd87e2692b
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }
    const token = jwt.sign({userID}, JWT_SECRET,{
        expiresIn: "7d",
    } );
    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 *1000, //miliseconds
        httpOnly: true, //prevent XSS attacks: cross-site scripting
        sameSite: "strict", //CSRF attacts
<<<<<<< HEAD
        secure: ENV.NODE_ENV === "development" ? false: true,
=======
        secure: process.env.NODE_ENV === "development" ? false: true,
>>>>>>> 457c702afcc6c769ce6866198198b0fd87e2692b
    });
    return token;
};

