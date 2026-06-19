import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { generateToken } from "../../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ENV } from "../../lib/env.js";


export const signup = async(req,res) => {
    const {fullName, email, password} = req.body
    const name = typeof fullName === "string" ? fullName.trim() : ""
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const pass = typeof password === "string" ? password : "";

    try {
        if(!name || !normalizedEmail || !pass ){
            return res.status(400).json({message: "All fields are required"})
        }
        if (pass.length < 6){
            return res.status(400).json({message:"Password must be at least 6 characters"})
        }

        // check email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)){
            return res.status(400).json({message:"Invalid email format"});

        // const user 
        }
        // const user = await User.findOne({email});
        // if(user) return res.status(400).json({message:"Email alreadyt exists"})

        const existing = await User.findOne({
            email : normalizedEmail});
        if (existing) return res.status(409).json({ message: "Email already exists"});

        // password hashing
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const newUser = new User({
            fullName: name,
            email: normalizedEmail,
            password: hashedPassword
        })
        if (newUser){
            const savedUser = await newUser.save();
            generateToken(newUser._id, res)
            res.status(201).json({
                _id:newUser._id,
                fullName:newUser.fullName,
                email:newUser.email,
                profilePic:newUser.profilePic,
            });
           
            // Send email
            try{
                await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL);

            } catch (error){
                console.error("Failed to send welcome email:", error);

            }

            


        } else{
            res.status(400).json({message:"Invalid user data"});
        }


    
    }   catch (error){
        console.log("Error in signup controller:", error)
        res.status(500).json({message:"Internal server error"});
    }
};