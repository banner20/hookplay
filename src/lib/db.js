import { supabase } from './supabase';

/**
 * List all projects for the current user (lightweight columns only).
 * @returns {Promise<Array>}
 */
export async function listProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, video_name, video_duration, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Load a single project by id (all columns).
 * @param {string} projectId
 * @returns {Promise<Object>}
 */
export async function loadProject(projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new project for the current user.
 * @param {{ name: string, hookConfig: Object, videoPath?: string, videoName?: string, videoDuration?: number }} params
 * @returns {Promise<Object>} The created project row.
 */
export async function createProject({ name, hookConfig, videoPath, videoName, videoDuration }) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: name ?? 'Untitled Project',
      hook_config: hookConfig ?? {},
      video_path: videoPath ?? null,
      video_name: videoName ?? null,
      video_duration: videoDuration ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing project.
 * @param {string} projectId
 * @param {{ name?: string, hookConfig?: Object, videoPath?: string, videoName?: string, videoDuration?: number }} fields
 * @returns {Promise<Object>} The updated project row.
 */
export async function updateProject(projectId, { name, hookConfig, videoPath, videoName, videoDuration } = {}) {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (hookConfig !== undefined) updates.hook_config = hookConfig;
  if (videoPath !== undefined) updates.video_path = videoPath;
  if (videoName !== undefined) updates.video_name = videoName;
  if (videoDuration !== undefined) updates.video_duration = videoDuration;

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a project by id.
 * @param {string} projectId
 * @returns {Promise<void>}
 */
export async function deleteProject(projectId) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
}
