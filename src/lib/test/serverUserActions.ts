// src/lib/serverUserActions.ts

import type { User } from './dexieModels'; // adjust import as needed

// Registration (Sign Up)
export async function registerUserOnServer(user: Omit<User, 'status'>): Promise<{ ok: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (response.ok) {
      const userData = await response.json();
      return { ok: true, user: userData };
    } else {
      return { ok: false, error: await response.text() };
    }
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// Login (Sign In)
export async function loginUserOnServer(email: string, password: string): Promise<{ ok: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (response.ok) {
      const userData = await response.json();
      return { ok: true, user: userData };
    } else {
      return { ok: false, error: await response.text() };
    }
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// Manager Login (Sign In as Manager)
export async function loginManagerOnServer(email: string, password: string): Promise<{ ok: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch('/api/users/loginmanager', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (response.ok) {
      const userData = await response.json();
      return { ok: true, user: userData };
    } else {
      return { ok: false, error: await response.text() };
    }
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
