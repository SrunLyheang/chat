import mongoose from "mongoose";

const userShcema = new mongoose.Schema(
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
        }
    },
    { timestamps: true } //Created at and updated at
);

const User = mongoose.model("User", userShcema);

export default User;