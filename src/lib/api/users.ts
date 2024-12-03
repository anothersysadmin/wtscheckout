import { getApiUrl } from '../utils';

export type User = {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  active: boolean;
  lastLogin?: string;
};

export type CreateUserData = {
  username: string;
  email: string;
  password: string;
  isAdmin: boolean;
};

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      message: `HTTP error! status: ${response.status}` 
    }));
    throw new Error(errorData.message || 'An error occurred');
  }
  return response.json();
}

export async function createUser(data: CreateUserData): Promise<User> {
  // For development, simulate API call
  if (import.meta.env.DEV) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: crypto.randomUUID(),
          username: data.username,
          email: data.email,
          isAdmin: data.isAdmin,
          active: true,
          lastLogin: new Date().toISOString()
        });
      }, 500);
    });
  }

  try {
    const response = await fetch(getApiUrl('users'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include', // Include cookies for authentication
    });
    return handleApiResponse<User>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create user');
  }
}

export async function fetchUsers(): Promise<User[]> {
  // For development, return mock data
  if (import.meta.env.DEV) {
    return [
      {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        isAdmin: true,
        active: true,
        lastLogin: new Date().toISOString()
      }
    ];
  }

  try {
    const response = await fetch(getApiUrl('users'), {
      credentials: 'include',
    });
    return handleApiResponse<User[]>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch users');
  }
}

export async function updateUserStatus(userId: string, active: boolean): Promise<void> {
  // For development, simulate API call
  if (import.meta.env.DEV) {
    return new Promise((resolve) => setTimeout(resolve, 500));
  }

  try {
    const response = await fetch(getApiUrl(`users/${userId}/status`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ active }),
      credentials: 'include',
    });
    await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update user status');
  }
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  // For development, simulate API call
  if (import.meta.env.DEV) {
    return new Promise((resolve) => setTimeout(resolve, 500));
  }

  try {
    const response = await fetch(getApiUrl(`users/${userId}/reset-password`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: newPassword }),
      credentials: 'include',
    });
    await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to reset password');
  }
}
