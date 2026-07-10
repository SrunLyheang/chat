import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        isBot: {
            type: Boolean,
            default: false
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        profilePic: {
            type: String,
            default: ""
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        verificationToken: {
            type: String,
            default: null
        },
        verificationTokenExpiry: {
            type: Date,
            default: null
        },
        // --- NEW: lets us cap/track verification emails per account (Issue #3) ---
        verificationAttempts: {
            type: Number,
            default: 0
        },
        lastVerificationSentAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true } //Created at and updated at
);

// --- Auto-delete accounts that never finish verifying ---
// MongoDB's TTL monitor sweeps roughly every 60s and removes any document
// where this field holds a Date in the past. partialFilterExpression means
// it only ever touches UNVERIFIED users. Once isEmailVerified flips to true
// we also null out verificationTokenExpiry, so verified accounts are excluded
// twice over (filter + no date to match) and can never be swept up here.
userSchema.index(
    { verificationTokenExpiry: 1 },
    {
        expireAfterSeconds: 0,
        partialFilterExpression: { isEmailVerified: false },
    }
);

const User = mongoose.model("User", userSchema);

export default User;