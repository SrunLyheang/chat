import { sendWelcomeEmail, sendVerificationEmail } from "../emails/emailHandlers.js";
import { generateToken } from "../../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ENV } from "../../lib/env.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { uploadImage } from "../../lib/cloudinary.js";


const MAX_VERIFICATION_ATTEMPTS = 5; // total verification emails allowed per account
const RESEND_COOLDOWN_MS = 30 * 1000; // min gap between sends

const VERIFICATION_WINDOW_MS = 15 * 60 * 1000;

// Generate random 6-digit verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


const checkCooldown = (lastSentAt) => {
    if (!lastSentAt || RESEND_COOLDOWN_MS === 0) return { onCooldown: false, waitSeconds: 0 };
    const elapsed = Date.now() - lastSentAt.getTime();
    if (elapsed >= RESEND_COOLDOWN_MS) return { onCooldown: false, waitSeconds: 0 };
    return { onCooldown: true, waitSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000) };
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

        const existing = await User.findOne({ email: normalizedEmail });

        // --- FIX #1: "Email in use" trap ---
        // If the existing record is already verified, it's a real account -> reject as before.
        // If it's NOT verified, it's just a leftover from an abandoned signup attempt:
        // update it in place and send a fresh code, instead of blocking the user.
        if (existing) {
            if (existing.isEmailVerified) {
                return res.status(409).json({ message: "Email already in use" });
            }

            const isExpired =
                existing.verificationTokenExpiry && new Date() > existing.verificationTokenExpiry;

            if (isExpired) {
                // They never finished verifying and their code has lapsed.
                // Don't wait on Mongo's TTL sweep (it runs ~once/minute) —
                // wipe the stale record now and fall through to the
                // "brand-new user" path below with a clean attempt budget.
                await User.deleteOne({ _id: existing._id });
            } else {
                // Still within the active verification window — same rate
                // limit as a manual resend applies, so this path can't be
                // used to bypass Issue #3's email cap.
                if (existing.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
                    return res.status(429).json({
                        message:
                            "This email has reached the maximum number of verification emails. Please contact support or use a different email.",
                    });
                }

                const { onCooldown, waitSeconds } = checkCooldown(existing.lastVerificationSentAt);
                if (onCooldown) {
                    return res.status(429).json({
                        message: `Please wait ${waitSeconds}s before requesting another verification email.`,
                    });
                }

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(pass, salt);
                const verificationCode = generateVerificationCode();
                const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_WINDOW_MS);

                existing.fullName = name;
                existing.password = hashedPassword;
                existing.verificationToken = verificationCode;
                existing.verificationTokenExpiry = verificationTokenExpiry;
                existing.verificationAttempts += 1;
                existing.lastVerificationSentAt = new Date();

                const savedUser = await existing.save();

                res.status(200).json({
                    _id: savedUser._id,
                    fullName: savedUser.fullName,
                    email: savedUser.email,
                    message: "Signup successful! Please verify your email.",
                });

                sendVerificationEmail(savedUser.email, savedUser.fullName, verificationCode)
                    .catch((err) => console.error("Failed to send verification email:", err));

                return;
            }
        }

        // Brand-new user — original flow, just also seeding the rate-limit fields
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(pass, salt)

        const verificationCode = generateVerificationCode();
        const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_WINDOW_MS);

        const newUser = new User({
            fullName: name,
            email: normalizedEmail,
            password: hashedPassword,
            verificationToken: verificationCode,
            verificationTokenExpiry: verificationTokenExpiry,
            isEmailVerified: false,
            verificationAttempts: 1,
            lastVerificationSentAt: new Date(),
        })

        const savedUser = await newUser.save();

        res.status(201).json({
            _id: savedUser._id,
            fullName: savedUser.fullName,
            email: savedUser.email,
            message: "Signup successful! Please verify your email."
        });


        sendVerificationEmail(savedUser.email, savedUser.fullName, verificationCode)
            .catch((err) => console.error("Failed to send verification email:", err));

    } catch (error) {

        if (error?.code === 11000) {
            return res.status(409).json({ message: "Email already in use" });
        }
        console.log("Error in signup controller:", error)
        res.status(500).json({ message: "Internal server error" });
    }
};


export const resendVerification = async (req, res) => {
    const { email } = req.body;

    try {
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        if (!normalizedEmail) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "No pending verification found for this email" });
        }
        if (user.isEmailVerified) {
            return res.status(400).json({ message: "This email is already verified. Please log in." });
        }
        if (user.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
            return res.status(429).json({
                message:
                    "Maximum verification attempts reached for this account. Please contact support or sign up again with a different email.",
            });
        }

        const { onCooldown, waitSeconds } = checkCooldown(user.lastVerificationSentAt);
        if (onCooldown) {
            return res.status(429).json({ message: `Please wait ${waitSeconds}s before requesting another code.` });
        }

        const verificationCode = generateVerificationCode();
        user.verificationToken = verificationCode;
        user.verificationTokenExpiry = new Date(Date.now() + VERIFICATION_WINDOW_MS);
        user.verificationAttempts += 1;
        user.lastVerificationSentAt = new Date();
        await user.save();

        res.status(200).json({
            message: "Verification email resent.",
            attemptsRemaining: Math.max(MAX_VERIFICATION_ATTEMPTS - user.verificationAttempts, 0),
        });

        sendVerificationEmail(user.email, user.fullName, verificationCode)
            .catch((err) => console.error("Failed to resend verification email:", err));

    } catch (error) {
        console.error("Error in resendVerification controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// --- FIX #4: Escape hatch — cancel a pending, unverified signup ---
// No auth middleware here on purpose: at this point the user has no JWT yet
// (it's only issued in verifyEmail/login below), so this mirrors the existing
// unauthenticated verifyEmail endpoint and is keyed off email + "unverified" only.
// Trade-off worth knowing: anyone who knows an email address could trigger this
// for someone else's *unverified* signup. It can't touch verified accounts, so the
// blast radius is "delete a stranger's not-yet-real signup," not account takeover —
// but if that's not acceptable for your app, gate it behind the verification code
// instead of just the email.
export const cancelVerification = async (req, res) => {
    const { email } = req.body;

    try {
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        if (!normalizedEmail) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email: normalizedEmail });

        // Nothing to cancel — respond 200 anyway so the frontend can reset cleanly either way
        if (!user) {
            return res.status(200).json({ message: "No pending verification found." });
        }
        if (user.isEmailVerified) {
            return res
                .status(400)
                .json({ message: "This account is already verified — use logout instead." });
        }

        await User.deleteOne({ _id: user._id });
        res.clearCookie("jwt"); // harmless even if no cookie was ever set

        res.status(200).json({ message: "Pending signup cancelled." });
    } catch (error) {
        console.error("Error in cancelVerification controller:", error);
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
        user.verificationAttempts = 0;
        user.lastVerificationSentAt = null;
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