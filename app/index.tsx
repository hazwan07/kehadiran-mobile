/**
 * app/index.tsx
 * 
 * Landing page — redirect to appropriate route.
 */

import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';

export default function Index() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Redirect href="/(main)/clock-in" />;
  }

  return <Redirect href="/(auth)/login" />;
}
