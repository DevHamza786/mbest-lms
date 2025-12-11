import { Session, LoginCredentials, SignupData, StoredUser } from '@/lib/types/auth';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/utils/storage';
import users from '@/data/users.json';
import { sleep } from './utils';

/**
 * Initialize users data in localStorage if not exists
 */
function initializeUsers(): StoredUser[] {
  let storedUsers = getStorageItem<StoredUser[]>(STORAGE_KEYS.USERS);
  
  if (!storedUsers) {
    // Convert JSON data to proper StoredUser objects
    storedUsers = users as StoredUser[];
    setStorageItem(STORAGE_KEYS.USERS, storedUsers);
  }
  
  return storedUsers;
}

/**
 * Mock login function with simulated network delay
 */
export async function fakeLogin(email: string, password: string): Promise<Session> {
  await sleep(800); // Simulate network delay
  
  const users = initializeUsers();
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  // Convert user to session (exclude password)
  const { password: _, ...session } = user;
  return session as Session;
}

/**
 * Mock signup function with simulated network delay
 */
export async function fakeSignup(data: SignupData): Promise<Session> {
  await sleep(1000); // Simulate network delay
  
  const users = initializeUsers();
  
  // Check if email already exists
  if (users.some(u => u.email === data.email)) {
    throw new Error('Email already exists');
  }
  
  // Validate passwords match
  if (data.password !== data.confirmPassword) {
    throw new Error('Passwords do not match');
  }
  
  // Create new user
  const newUser: StoredUser = {
    id: `user-${Date.now()}`,
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
    createdAt: new Date().toISOString(),
  };
  
  // Add to users array and save
  users.push(newUser);
  setStorageItem(STORAGE_KEYS.USERS, users);
  
  // Convert to session (exclude password)
  const { password: _, ...session } = newUser;
  return session as Session;
}

/**
 * Mock password reset function
 */
export async function fakePasswordReset(email: string): Promise<void> {
  await sleep(600);
  
  const users = initializeUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    throw new Error('Email not found');
  }
  
  // In a real app, this would send an email
  console.log(`Password reset email sent to ${email}`);
}

/**
 * Mock function to check if email exists
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  await sleep(300);
  
  const users = initializeUsers();
  return users.some(u => u.email === email);
}