import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion-react-native';
import { supabase, signInWithWallet, signOutWallet, getCurrentWalletUser } from '../lib/supabase';

interface User {
  id: string;
  walletAddress: string;
  username?: string;
  displayName?: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isConnected: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get wallet connection from Abstraxion
  const { data: account, isConnected } = useAbstraxionAccount();

  const loadUser = async (walletAddress: string) => {
    try {
      setIsLoading(true);

      // Sign in with wallet-based authentication
      const authResult = await signInWithWallet(walletAddress);
      
      if (authResult && authResult.user && !authResult.error) {
        const userData: User = {
          id: authResult.user.id,
          walletAddress: authResult.user.wallet_address,
          username: authResult.user.user_metadata?.username,
          displayName: authResult.user.user_metadata?.display_name,
          profilePicture: authResult.user.user_metadata?.profile_picture,
        };

        setUser(userData);
        console.log('✅ User signed in with wallet auth:', walletAddress.slice(0, 8) + '...');
      } else {
        console.error('Failed to sign in with wallet:', authResult?.error);
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user with wallet auth:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (account?.bech32Address) {
      await loadUser(account.bech32Address);
    }
  };

  const signOut = async () => {
    try {
      await signOutWallet();
      setUser(null);
      console.log('✅ User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Check for existing session on app start
  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await getCurrentWalletUser();
        if (currentUser && currentUser.wallet_address) {
          const userData: User = {
            id: currentUser.id,
            walletAddress: currentUser.wallet_address,
            username: currentUser.user_metadata?.username,
            displayName: currentUser.user_metadata?.display_name,
            profilePicture: currentUser.user_metadata?.profile_picture,
          };
          setUser(userData);
          console.log('✅ Restored user session:', currentUser.wallet_address.slice(0, 8) + '...');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Load user when wallet connects
  useEffect(() => {
    if (isConnected && account?.bech32Address) {
      loadUser(account.bech32Address);
    } else if (!isConnected) {
      // Wallet disconnected, sign out
      signOut();
    }
  }, [isConnected, account?.bech32Address]);

  const value: AuthContextType = {
    user,
    isLoading,
    isConnected,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};