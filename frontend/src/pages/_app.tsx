import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '../hooks/useAuth';
import AuthService from '../services/auth.service';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const authService = AuthService.getInstance();
    const publicRoutes = ['/', '/login', '/auth/login', '/register-teacher'];

    const isPublic = (path: string) => publicRoutes.some(r => path.startsWith(r));

    const verifyAuth = async (path: string) => {
      if (isPublic(path)) return;
      try {
        const user = authService.getCurrentUser() || await authService.getProfile();
        if (!user) {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      }
    };

    // Check on first load
    verifyAuth(router.asPath);

    // Check on route changes
    const handleRouteChange = (url: string) => {
      verifyAuth(url);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
