'use server';

import { revalidatePath } from 'next/cache';
import { createBuildAuthHeader } from '@/lib/buildAuth';

// Define caching times
const CACHE_TIMES = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
};

/**
 * Server action to fetch users list with caching
 */
export async function fetchUsers(searchQuery?: string) {
  try {
    const url = searchQuery 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?search=${encodeURIComponent(searchQuery)}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`;
      
    const response = await fetch(url, {
      cache: 'no-store', // Dynamic data should not be cached
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

/**
 * Server action to fetch tuning requests with cache control
 */
export async function fetchTuningRequests(status?: string) {
  try {
    const url = status 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/tuning-requests?status=${encodeURIComponent(status)}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/tuning-requests`;
      
    const response = await fetch(url, {
      next: { revalidate: CACHE_TIMES.SHORT }, // Revalidate every minute
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch tuning requests');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching tuning requests:', error);
    return { success: false, error: 'Failed to fetch tuning requests' };
  }
}

/**
 * Server action to fetch security logs with intelligent caching
 */
export async function fetchSecurityLogs(page = 1, limit = 50) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/security/logs?page=${page}&limit=${limit}`, 
      {
        next: { revalidate: CACHE_TIMES.MEDIUM }, // Cache for 5 minutes
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch security logs');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching security logs:', error);
    return { success: false, error: 'Failed to fetch security logs' };
  }
}

/**
 * Server action to update tuning request status
 * No caching for mutations, but revalidates the affected paths
 */
export async function updateTuningRequestStatus(requestId: number, status: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/tuning-requests/${requestId}/status`, 
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
        cache: 'no-store',
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to update tuning request status');
    }
    
    // Revalidate affected paths to reflect changes
    revalidatePath('/admin/tuning-requests');
    revalidatePath(`/admin/tuning-requests/${requestId}`);
    revalidatePath('/dashboard/tuning-history');
    
    return response.json();
  } catch (error) {
    console.error('Error updating tuning request status:', error);
    return { success: false, error: 'Failed to update tuning request status' };
  }
}

/**
 * Server action to fetch dashboard stats with appropriate caching
 */
export async function fetchAdminDashboardStats() {
  try {
    // For server components, we need to construct the full URL properly
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/admin/stats`;

    console.log('Fetching admin dashboard stats from URL:', url);

    // Set a timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 5000)
    );

    // Create fetch request with abort controller
    const controller = new AbortController();
    const fetchPromise = fetch(url, {
      next: { revalidate: CACHE_TIMES.SHORT }, // Revalidate every minute
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

      // Return mock data during build time
      if (process.env.NODE_ENV === 'production' && process.env.BUILD_AUTH_TOKEN) {
        console.log('🏗️ Build-time: Using mock data for admin stats');
        return {
          success: true,
          pendingRequests: 0,
          pendingRequestsChange: 0,
          activeUsers: 0,
          activeUsersChange: 0,
          creditsSold: 0,
          creditsSoldChange: 0,
          revenue: 0,
          revenueChange: 0,
          recentActivities: []
        };
      }

      throw new Error(`Failed to fetch dashboard stats: ${response?.status || 'Request failed'}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);

    // Fallback data structure in case of errors
    // This prevents undefined component errors
    return {
      success: false,
      error: 'Failed to fetch dashboard stats',
      pendingRequests: 0,
      pendingRequestsChange: 0,
      activeUsers: 0,
      activeUsersChange: 0,
      creditsSold: 0,
      creditsSoldChange: 0,
      revenue: 0,
      revenueChange: 0,
      recentActivities: []
    };
  }
}
