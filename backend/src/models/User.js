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
        // Only relevant when isBot is true. Tells lib/ai/index.js which
        // provider + model to call for this bot's replies.
        botProvider: {
            type: String,
            enum: ["gemini", "groq"], // add new provider keys here as you register them in lib/ai/index.js
            default: undefined,
        },
        botModel: {
            type: String,
            default: undefined,
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
        // Per-viewer nicknames for other users, keyed by that user's id.
        // Only the owner of this document sees these names.
        nicknames: {
            type: Map,
            of: String,
            default: {}
        },
        // Chats this user pinned to the top of their chat list (ids of the other user).
        pinnedChats: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "User",
            default: []
        },
        // Users this account has blocked. Only affects the blocker's own view:
        // blocked users are hidden from this user's contacts/chats/search and their
        // realtime messages are not delivered here. The blocked user is unaffected.
        blockedUsers: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "User",
            default: []
        },
        // Accepted friends (mutual). Denormalized on both users for fast lookup;
        // the source of truth for pending/declined state is the FriendRequest collection.
        friends: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "User",
            default: []
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
