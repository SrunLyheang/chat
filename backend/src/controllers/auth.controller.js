import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { generateToken } from "../../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ENV } from "../../lib/env.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import cloudinary from "../../lib/cloudinary.js";


export const signup = async (req, res) => {
    const { fullName, email, password } = req.body
    const name = typeof fullName === "string" ? fullName.trim() : ""
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const pass = typeof password === "string" ? password : "";

    try {
        if (!name || !normalizedEmail || !pass) {
            return res.status(400).json({ message: "All fields are required" })
        }
        if (pass.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" })
        }

        // check email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ message: "Invalid email format" });

            // const user 
        }
        // const user = await User.findOne({email});
        // if(user) return res.status(400).json({message:"Email alreadyt exists"})

        const existing = await User.findOne({
            email: normalizedEmail
        });
        if (existing) return res.status(409).json({ message: "Email already exists" });

        // password hashing
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(pass, salt)

        const newUser = new User({
            fullName: name,
            email: normalizedEmail,
            password: hashedPassword
        })
        if (newUser) {
            const savedUser = await newUser.save();
            generateToken(newUser._id, res)

            res.status(201).json({
                _id: savedUser._id,
                fullName: savedUser.fullName,
                email: savedUser.email,
                profilePic: savedUser.profilePic,
            });

            // Fire-and-forget: don't block response on email
            sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL)
                .catch((err) => console.error("Failed to send welcome email:", err));

            return;

        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in signup controller:", error)
        res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    try {
        const user = await User.findOne({ email })
        if (!user) return res.status(400).json({ message: "Check again" });

        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if (!isPasswordCorrect) return res.status(400).json({ message: "Check again" });

        generateToken(user._id, res)

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.error("Error in login controller:", error);
        res.status(500).json({ message: "Internal server error" });


    }
};

export const logout = (_, res) => {
    res.cookie("jwt", "", { maxAge: 0 })
    res.status(200).json({ message: "Log out successfully" });

};


export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        if (!profilePic) return res.status(400).json({ message: "Profile pic is required" })
        const userId = req.user._id;

        const uploadresponse = await cloudinary.uploader(profilePic)

        const updatedUser = await User.findByIdAndUpdate(userId,
            { profilePic: uploadresponse.secure_url },
            { new: true }
        );
        res.status(200).json(updatedUser)

    } catch (error) {
        console.log("Error in update profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }

};