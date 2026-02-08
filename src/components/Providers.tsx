'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactNode } from 'react';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            {children}
        </GoogleOAuthProvider>
    );
}
