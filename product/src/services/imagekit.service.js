const ImageKit = require('@imagekit/nodejs');

let client = null;

// ✅ Initialize ImageKit only once
function getClient() {
  if (client) return client;

  const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;

  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    throw new Error(
      'ImageKit not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in your environment.'
    );
  }

  client = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    privateKey: IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
  });

  return client;
}

/**
 * ✅ Upload a single image to ImageKit
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - File name
 * @returns {Promise<object>} - Uploaded file info
 */
async function uploadSingleImage(buffer, fileName) {
  const imagekit = getClient();
  const fileBase64 = buffer.toString('base64');

  // New SDK exposes upload under the `files` resource
  return await imagekit.files.upload({
    file: fileBase64,
    fileName,
    useUniqueFileName: true,
  });
}

/**
 * ✅ Upload multiple images (up to 5)
 * @param {Array} files - Array of file objects (from multer)
 * @returns {Promise<Array>} - Uploaded files info
 */
async function uploadMultipleImages(files) {
  if (!files || files.length === 0) throw new Error('No files provided.');
  if (files.length > 5) throw new Error('Maximum 5 files can be uploaded at once.');

  const uploads = files.map((file) => uploadSingleImage(file.buffer, file.originalname));
  return await Promise.all(uploads);
}

/**
 * ✅ Delete image by fileId
 * @param {string} fileId
 */
async function deleteFile(fileId) {
  const imagekit = getClient();
  // New SDK exposes delete under the `files` resource
  return await imagekit.files.delete(fileId);
}

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  deleteFile,
};
