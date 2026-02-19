import cloudinary from "../config/cloudinary";

export const getSignedResumeUrl = (
  publicId: string,
  expiresInSeconds = 3600,
): string => {
  return cloudinary.url(publicId, {
    resource_type: "raw",
    type: "upload", // or 'authenticated' if you set it private
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
};
