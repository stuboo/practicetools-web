import { AxiosResponse } from "axios";
import apiClient from "./client";

export interface User {
  id: number;
  name: string;
  email: string;
  practice_id?: string;
  is_admin: boolean;
}

export interface CreateUserData {
  name: string;
  email: string;
  temporary_password: string;
  is_admin?: boolean;
}

export interface ResetPasswordData {
  new_password: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

/**
 * List all users
 */
export async function listUsers(): Promise<User[]> {
  try {
    const response: AxiosResponse<User[]> = await apiClient.get('/admin/auth/users');
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch users');
  }
}

/**
 * Create a new user (admin only)
 */
export async function createUser(data: CreateUserData): Promise<User> {
  try {
    const response: AxiosResponse<User> = await apiClient.post('/admin/auth/users', data);
    return response.data;
  } catch (error) {
    throw new Error('Failed to create user');
  }
}

/**
 * Reset a user's password (admin only)
 */
export async function resetUserPassword(userId: number, password: string): Promise<void> {
  try {
    await apiClient.post(`/admin/auth/users/${userId}/reset-password`, {
      new_password: password
    });
  } catch (error) {
    throw new Error('Failed to reset password');
  }
}

/**
 * Change current user's password
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  try {
    await apiClient.post('/admin/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
  } catch (error) {
    throw new Error('Failed to change password');
  }
}

/**
 * Get a specific user by ID
 */
export async function getUser(userId: number): Promise<User> {
  try {
    const response: AxiosResponse<User> = await apiClient.get(`/admin/auth/users/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch user');
  }
}

/**
 * Delete a user by ID
 */
export async function deleteUser(userId: number): Promise<void> {
  try {
    await apiClient.delete(`/admin/auth/users/${userId}`);
  } catch (error) {
    throw new Error('Failed to delete user');
  }
}
