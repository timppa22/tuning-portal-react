'use server';

import { createBuildAuthHeader } from '@/lib/buildAuth';

/**
 * Server action to fetch tuning files
 * This can be imported and used in server components directly
 */
export async function fetchTuningFiles() {
  try {
    // For server components, we need to construct the full URL properly
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/tuning/history`;
    
    console.log('Fetching tuning files from URL:', url);
    
    // Set a timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 5000)
    );
    
    // Create fetch request with abort controller
    const controller = new AbortController();
    const fetchPromise = fetch(url, {
      next: { revalidate: 60 }, // Revalidate every minute
      headers: createBuildAuthHeader(),
      signal: controller.signal
    });
    
    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise])
      .catch(error => {
        controller.abort();
        console.error(`Fetch error: ${error.message}`);
        return null;
      }) as Response | null;
    
    // Handle failed or invalid responses
    if (!response || !response.ok) {
      console.warn(`API response not ok: ${response?.status || 'Request failed'}`);
      
      // Return empty array during build time
      if (process.env.NODE_ENV === 'production' && process.env.BUILD_AUTH_TOKEN) {
        console.log('🏗️ Build-time: Using empty array for tuning files');
        return {
          success: true,
          tuningFiles: []
        };
      }
      
      throw new Error(`Failed to fetch tuning files: ${response?.status || 'Request failed'}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching tuning files:', error);
    
    // Return empty array during build time
    if (process.env.NODE_ENV === 'production' && process.env.BUILD_AUTH_TOKEN) {
      console.log('🏗️ Build-time: Using empty array for tuning files after error');
      return {
        success: true,
        tuningFiles: []
      };
    }
    
    throw error;
  }
}

/**
 * Server action to fetch user profile data
 * This can be imported and used in server components directly
 */
export async function fetchUserProfile() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, error: 'Failed to fetch user profile' };
  }
} 