import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export const MAX_PHOTO_COUNT = 6;
export const MIN_PHOTO_COUNT = 1;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

/**
 * Validates a single image file for format and size.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateImageFile(file) {
  if (!file) return "Fayl topilmadi";

  const lowerName = (file.name || "").toLowerCase();
  const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const hasAllowedMime = ALLOWED_MIME_TYPES.has(file.type);

  if (!hasAllowedMime && !hasAllowedExt) {
    return "Bu formatdagi rasm qo‘llab-quvvatlanmaydi. Faqat JPG, PNG, WEBP formatlari qabul qilinadi.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Rasm hajmi juda katta (maksimal 10 MB).";
  }

  return null;
}

/**
 * Uploads an array of image files to Firebase Storage under profile_photos/{userId}/
 * Returns an array of public download URLs.
 */
export async function uploadProfilePhotos(userId, photoItems) {
  if (!photoItems || photoItems.length === 0) {
    return [];
  }

  const uploadPromises = photoItems.map(async (item, index) => {
    // If it's already an uploaded URL string, retain it
    if (typeof item === "string" && (item.startsWith("http://") || item.startsWith("https://"))) {
      return item;
    }

    const file = item.file || item;
    if (!(file instanceof File) && !(file instanceof Blob)) {
      if (item.url) return item.url;
      throw new Error("Yaroqsiz rasm fayli");
    }

    const extMatch = (file.name || "").match(/\.[a-zA-Z0-9]+$/);
    const ext = extMatch ? extMatch[0].toLowerCase() : ".jpg";
    const cleanExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : ".jpg";
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const storagePath = `profile_photos/${userId}/${timestamp}_${index}_${randomSuffix}${cleanExt}`;

    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || "image/jpeg",
    });

    return await getDownloadURL(snapshot.ref);
  });

  return await Promise.all(uploadPromises);
}
