import React from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';

export const isAuth0Configured = (): boolean => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  return Boolean(
    domain &&
    clientId &&
    domain !== 'MY_AUTH0_DOMAIN' &&
    clientId !== 'MY_AUTH0_CLIENT_ID'
  );
};

export interface Auth0ProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * Wraps the app with Auth0Provider when credentials are provided in .env.
 * Falls back cleanly without crashing when credentials are not yet set.
 */
export const Auth0ProviderWrapper: React.FC<Auth0ProviderWrapperProps> = ({ children }) => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

  if (!isAuth0Configured()) {
    return <>{children}</>;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : undefined,
        ...(audience ? { audience } : {})
      }}
    >
      {children}
    </Auth0Provider>
  );
};

export { useAuth0, Auth0Provider };
