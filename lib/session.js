import { getServerSession } from 'next-auth';
import { authOptions } from './auth.js';

export function getSession() {
  return getServerSession(authOptions);
}
