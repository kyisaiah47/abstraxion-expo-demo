import { createClient } from '@supabase/supabase-js';

// Use environment variables for keys
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mchiibkcxzejravsckzc.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable custom JWT handling
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Service client for server-side operations (bypasses RLS)
export const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Storage buckets (created by SQL migration)
export const AVATARS_BUCKET = 'avatars';
export const PROOFS_BUCKET = 'proofs';
export const DISPUTES_BUCKET = 'disputes';

// Default bucket for backwards compatibility
export const STORAGE_BUCKET = PROOFS_BUCKET;

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

// Generate signed URL for secure file uploads
export async function createSignedUploadUrl(
  filePath: string,
  bucket: string = STORAGE_BUCKET,
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath, {
        expiresIn,
      });

    if (error) {
      console.error('Failed to create signed upload URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Exception creating signed upload URL:', error);
    return null;
  }
}

// Generate signed URL for secure file downloads
export async function createSignedDownloadUrl(
  filePath: string,
  bucket: string = STORAGE_BUCKET,
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Failed to create signed download URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Exception creating signed download URL:', error);
    return null;
  }
}

// Upload file using signed URL (more secure)
export async function uploadFileSecure(
  file: { uri: string; name: string; type: string },
  bucket: string = STORAGE_BUCKET
): Promise<{ path: string; signedUrl: string; publicUrl: string } | null> {
  try {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `uploads/${fileName}`;

    // Create signed upload URL
    const signedUrl = await createSignedUploadUrl(filePath, bucket);
    if (!signedUrl) {
      console.error('Failed to get signed upload URL');
      return null;
    }

    // Convert URI to blob
    const response = await fetch(file.uri);
    const blob = await response.blob();

    // Upload using signed URL
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      console.error('Upload failed:', uploadResponse.statusText);
      return null;
    }

    // Get public URL for display purposes
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      path: filePath,
      signedUrl,
      publicUrl,
    };
  } catch (error) {
    console.error('Secure upload failed:', error);
    return null;
  }
}

// Get secure download URL for private files
export async function getSecureDownloadUrl(
  filePath: string,
  bucket: string = STORAGE_BUCKET,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    return await createSignedDownloadUrl(filePath, bucket, expiresIn);
  } catch (error) {
    console.error('Failed to get secure download URL:', error);
    return null;
  }
}

// Delete file from storage
export async function deleteFile(
  filePath: string,
  bucket: string = STORAGE_BUCKET
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Failed to delete file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception deleting file:', error);
    return false;
  }
}

// Upload and link file to user profile (avatar)
export async function uploadAvatar(
  file: { uri: string; name: string; type: string },
  userId: string
): Promise<string | null> {
  try {
    const fileName = `avatar-${userId}-${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `${fileName}`; // Avatars bucket doesn't need subfolder

    const result = await uploadFileSecure(file, AVATARS_BUCKET);
    if (!result) {
      return null;
    }

    // Update user profile with new avatar
    const { error } = await supabase
      .from('users')
      .update({
        profile_picture: result.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update user avatar:', error);
      // Clean up uploaded file
      await deleteFile(result.path, AVATARS_BUCKET);
      return null;
    }

    return result.publicUrl;
  } catch (error) {
    console.error('Avatar upload failed:', error);
    return null;
  }
}

// Upload evidence file for task
export async function uploadEvidence(
  file: { uri: string; name: string; type: string },
  taskId: string
): Promise<{ path: string; hash: string; url: string } | null> {
  try {
    const fileHash = await generateFileHash(file.uri);
    const fileName = `evidence-${taskId}-${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `${fileName}`; // Proofs bucket structure

    const result = await uploadFileSecure(file, PROOFS_BUCKET);
    if (!result) {
      return null;
    }

    return {
      path: result.path,
      hash: fileHash,
      url: result.publicUrl,
    };
  } catch (error) {
    console.error('Evidence upload failed:', error);
    return null;
  }
}

// Upload dispute attachment file
export async function uploadDisputeEvidence(
  file: { uri: string; name: string; type: string },
  taskId: string,
  disputerId: string
): Promise<{ path: string; hash: string; url: string } | null> {
  try {
    const fileHash = await generateFileHash(file.uri);
    const fileName = `dispute-${taskId}-${disputerId}-${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `${fileName}`;

    const result = await uploadFileSecure(file, DISPUTES_BUCKET);
    if (!result) {
      return null;
    }

    return {
      path: result.path,
      hash: fileHash,
      url: result.publicUrl,
    };
  } catch (error) {
    console.error('Dispute evidence upload failed:', error);
    return null;
  }
}

// ===== WALLET-BASED AUTHENTICATION =====

// Sign in with wallet address and create custom session
export async function signInWithWallet(
  walletAddress: string,
  signature?: string // For future signature verification
): Promise<{ user: any; session: any; error: any } | null> {
  try {
    // Create or get user record
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Failed to fetch user:', userError);
      return { user: null, session: null, error: userError };
    }

    // Create user if doesn't exist
    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          wallet_address: walletAddress,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create user:', createError);
        return { user: null, session: null, error: createError };
      }
      user = newUser;
    }

    // Create custom session with wallet address in metadata
    const customUser = {
      id: user.id,
      email: `${walletAddress}@proofpay.wallet`, // Pseudo-email for Supabase
      wallet_address: walletAddress,
      user_metadata: {
        wallet_address: walletAddress,
        username: user.username,
        display_name: user.display_name,
        profile_picture: user.profile_picture,
      },
      app_metadata: {
        provider: 'wallet',
        wallet_type: 'xion',
      },
    };

    // Set the session manually (this bypasses normal Supabase auth)
    await supabase.auth.setSession({
      access_token: await createCustomJWT(user.id, walletAddress),
      refresh_token: `refresh_${user.id}_${Date.now()}`,
      expires_in: 3600, // 1 hour
      token_type: 'bearer',
      user: customUser,
    });

    const session = await supabase.auth.getSession();

    return {
      user: customUser,
      session: session.data.session,
      error: null,
    };

  } catch (error) {
    console.error('Wallet sign-in failed:', error);
    return { user: null, session: null, error };
  }
}

// Create custom JWT with wallet address claims
async function createCustomJWT(userId: string, walletAddress: string): Promise<string> {
  try {
    // In a real app, this would be signed on your backend with your Supabase JWT secret
    // For now, we'll create a mock JWT structure
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const payload = {
      sub: userId,
      aud: 'authenticated',
      role: 'authenticated',
      iss: 'proofpay',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      wallet_address: walletAddress,
      app_metadata: {
        provider: 'wallet',
        wallet_address: walletAddress,
      },
      user_metadata: {
        wallet_address: walletAddress,
      },
    };

    // Base64 encode (this is a simplified JWT - in production you'd use proper JWT library)
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = btoa(`${encodedHeader}.${encodedPayload}.wallet_signed`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  } catch (error) {
    console.error('Failed to create custom JWT:', error);
    return `fallback_token_${userId}_${Date.now()}`;
  }
}

// Sign out and clear session
export async function signOutWallet(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Sign out failed:', error);
  }
}

// Get current wallet user
export async function getCurrentWalletUser(): Promise<any | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

// Update user profile with wallet-based auth
export async function updateUserProfile(
  userId: string,
  updates: {
    username?: string;
    display_name?: string;
    profile_picture?: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating user profile:', error);
    return false;
  }
}

// Verify wallet signature (placeholder for future implementation)
export async function verifyWalletSignature(
  walletAddress: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    // TODO: Implement actual signature verification with XION/Cosmos SDK
    // For now, just return true as placeholder
    return true;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// Create challenge message for wallet signing
export function createWalletChallenge(walletAddress: string, nonce?: string): string {
  const timestamp = new Date().toISOString();
  const randomNonce = nonce || Math.random().toString(36).substring(7);
  
  return `Sign this message to authenticate with ProofPay:

Wallet: ${walletAddress}
Timestamp: ${timestamp}
Nonce: ${randomNonce}

This request will not trigger a transaction or cost any gas fees.`;
}