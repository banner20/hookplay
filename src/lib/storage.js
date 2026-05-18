import { supabase } from './supabase';

const BUCKET = 'videos';

/**
 * Upload a video file to Supabase Storage.
 * Path format: {userId}/{projectId}/{timestamp}.{ext}
 *
 * @param {File} file - The video File object.
 * @param {string} userId - The authenticated user's id.
 * @param {string} projectId - The project id (or temp id before project is created).
 * @returns {Promise<string>} The storage path of the uploaded file.
 */
export async function uploadVideo(file, userId, projectId) {
  const ext = file.name.split('.').pop() || 'mp4';
  const path = `${userId}/${projectId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'video/mp4',
    });

  if (error) throw error;
  return path;
}

/**
 * Generate a signed URL for a stored video (default 24-hour expiry).
 *
 * @param {string} path - Storage path returned by uploadVideo.
 * @param {number} expiresIn - Expiry duration in seconds (default 86400 = 24h).
 * @returns {Promise<string>} A signed URL string.
 */
export async function getVideoSignedUrl(path, expiresIn = 86400) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Delete a video from storage.
 *
 * @param {string} path - Storage path to delete.
 * @returns {Promise<void>}
 */
export async function deleteVideo(path) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  if (error) throw error;
}
