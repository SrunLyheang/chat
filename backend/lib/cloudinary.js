import { v2 as cloudinary } from "cloudinary";
import { ENV } from "./env.js";

const requiredCloudinaryEnv = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
];

for (const envName of requiredCloudinaryEnv) {
    if (!ENV[envName]) {
        console.warn(`Missing Cloudinary env variable: ${envName}`);
    }
}

cloudinary.config({
    cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
    api_key: ENV.CLOUDINARY_API_KEY,
    api_secret: ENV.CLOUDINARY_API_SECRET,
    secure: true,
});

export const uploadImage = (image, options = {}) => {
    return cloudinary.uploader.upload(image, {
        resource_type: "image",
        ...options,
    });
};

export default cloudinary;
