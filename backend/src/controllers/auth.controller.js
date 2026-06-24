import { sendWelcomeEmail, sendVerificationEmail } from "../emails/emailHandlers.js";
import { generateToken } from "../../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ENV } from "../../lib/env.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { uploadImage } from "../../lib/cloudinary.js";

// Generate random 6-digit verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

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
        }

        const existing = await User.findOne({
            email: normalizedEmail
        });
        if (existing) return res.status(409).json({ message: "Email already exists" });

        // password hashing
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(pass, salt)

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const newUser = new User({
            fullName: name,
            email: normalizedEmail,
            password: hashedPassword,
            verificationToken: verificationCode,
            verificationTokenExpiry: verificationTokenExpiry,
            isEmailVerified: false
        })

        if (newUser) {
            const savedUser = await newUser.save();

            res.status(201).json({
                _id: savedUser._id,
                fullName: savedUser.fullName,
                email: savedUser.email,
                message: "Signup successful! Please verify your email."
            });

            // Fire-and-forget: don't block response on email
            sendVerificationEmail(savedUser.email, savedUser.fullName, verificationCode)
                .catch((err) => console.error("Failed to send verification email:", err));

            return;

        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in signup controller:", error)
        res.status(500).json({ message: "Internal server error" });
    }
};

export const verifyEmail = async (req, res) => {
    const { email, verificationCode } = req.body;

    try {
        if (!email || !verificationCode) {
            return res.status(400).json({ message: "Email and verification code are required" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: "Email already verified" });
        }

        if (user.verificationToken !== verificationCode) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        if (new Date() > user.verificationTokenExpiry) {
            return res.status(400).json({ message: "Verification code has expired" });
        }

        // Update user as verified
        user.isEmailVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpiry = null;
        await user.save();

        // Generate JWT token after verification
        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            message: "Email verified successfully!"
        });

        // Fire-and-forget: send welcome email
        sendWelcomeEmail(user.email, user.fullName, ENV.CLIENT_URL)
            .catch((err) => console.error("Failed to send welcome email:", err));

    } catch (error) {
        console.error("Error in verifyEmail controller:", error);
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
        const user = await User.findOne({ email: normalizedEmail })
        if (!user) return res.status(400).json({ message: "Check again" });

        if (!user.isEmailVerified) {
            return res.status(403).json({ message: "Please verify your email first" });
        }

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
        if (typeof profilePic !== "string" || !profilePic.startsWith("data:image/")) {
            return res.status(400).json({ message: "Profile pic must be a base64 image" });
        }

        const userId = req.user._id;

        const uploadResponse = await uploadImage(profilePic, {
            folder: "chat-app/profile-pictures",
            public_id: userId.toString(),
            overwrite: true,
        });

        const updatedUser = await User.findByIdAndUpdate(userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        );
        res.status(200).json(updatedUser)

    } catch (error) {
        console.log("Error in update profile:", {
            message: error.message,
            http_code: error.http_code,
            name: error.name,
        });
        if (error.http_code) {
            return res.status(error.http_code).json({
                message: error.message || "Cloudinary upload failed",
            });
        }

        res.status(500).json({ message: "Internal server error" });
    }

};
