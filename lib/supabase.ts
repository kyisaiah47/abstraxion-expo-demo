import { createClient } from '@supabase/supabase-js';

// These would normally come from environment variables
// For demo purposes, using placeholder values
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket for avatars and evidence files
export const STORAGE_BUCKET = 'proofpay-files';

// Upload file to Supabase Storage
export async function uploadFile(
  file: { uri: string; name: string; type: string },
  bucket: string = STORAGE_BUCKET
): Promise<{ path: string; url: string } | null> {
  try {
    // Convert URI to blob (for web compatibility)
    const response = await fetch(file.uri);
    const blob = await response.blob();
    
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: publicUrl
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
}

// Generate SHA-256 hash for file integrity
export async function generateFileHash(uri: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Hash generation failed:', error);
    return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}