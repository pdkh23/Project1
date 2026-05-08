import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from './api';

const KEY = 'brs.user';

export async function saveUser(user: User) {
  await AsyncStorage.setItem(KEY, JSON.stringify(user));
}

export async function loadUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

export async function clearUser() {
  await AsyncStorage.removeItem(KEY);
}
