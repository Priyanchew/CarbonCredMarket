import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginData, RegisterData, SellerVerification } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  updateSellerVerification: (verification: SellerVerification) => void;
  initialize: () => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  registerBuyer: (data: RegisterData) => Promise<void>;
  registerSeller: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      setUser: (user) => 
        set((state) => ({ 
          ...state, 
          user, 
          isAuthenticated: !!user 
        })),
      setToken: (token) => {
        set((state) => ({ 
          ...state, 
          token,
          isAuthenticated: !!token
        }));
        
        // Update API client token
        if (typeof window !== 'undefined') {
          import('../lib/api').then(({ default: apiClient }) => {
            if (token) {
              apiClient.setToken(token);
            } else {
              apiClient.logout();
            }
          });
        }
      },
      setLoading: (isLoading) => 
        set((state) => ({ 
          ...state, 
          isLoading 
        })),
      setInitialized: (isInitialized) =>
        set((state) => ({
          ...state,
          isInitialized
        })),
      updateSellerVerification: (verification: SellerVerification) => {
        console.log('Updating seller verification:', verification);
        set((state) => {
          const updatedState = {
            ...state,
            user: state.user ? {
              ...state.user,
              seller_verification: verification
            } : null
          };
          console.log('Updated user state:', updatedState.user);
          return updatedState;
        });
      },
      refreshUser: async () => {
        const state = get();
        if (!state.token) return;
        
        try {
          const { default: apiClient } = await import('../lib/api');
          const user = await apiClient.getCurrentUser();
          console.log('Refreshed user data:', user);
          set((state) => ({ 
            ...state, 
            user
          }));
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      },
      initialize: async () => {
        const state = get();
        if (state.isInitialized) return;
        
        set((state) => ({ ...state, isLoading: true }));
        
        try {
          if (state.token) {
            // Validate the stored token by checking current user
            const { default: apiClient } = await import('../lib/api');
            apiClient.setToken(state.token);
            
            try {
              const user = await apiClient.getCurrentUser();
              set((state) => ({ 
                ...state, 
                user, 
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true
              }));
            } catch (authError) {
              // Token is invalid, clear it
              console.warn('Stored token is invalid, clearing authentication:', authError);
              set(() => ({ 
                user: null, 
                token: null, 
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true
              }));
              apiClient.logout();
            }
          } else {
            set((state) => ({ 
              ...state, 
              isLoading: false,
              isInitialized: true
            }));
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          set((state) => ({ 
            ...state, 
            isLoading: false,
            isInitialized: true
          }));
        }
      },
      login: async (data: LoginData) => {
        set((state) => ({ ...state, isLoading: true }));
        
        try {
          const { default: apiClient } = await import('../lib/api');
          const response = await apiClient.login(data);
          
          set((state) => ({
            ...state,
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false
          }));
          
          apiClient.setToken(response.token);
        } catch (error) {
          set((state) => ({ ...state, isLoading: false }));
          throw error;
        }
      },
      register: async (data: RegisterData) => {
        set((state) => ({ ...state, isLoading: true }));
        
        try {
          const { default: apiClient } = await import('../lib/api');
          const response = await apiClient.register(data);
          
          set((state) => ({
            ...state,
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false
          }));
          
          apiClient.setToken(response.token);
        } catch (error) {
          set((state) => ({ ...state, isLoading: false }));
          throw error;
        }
      },
      registerBuyer: async (data: RegisterData) => {
        set((state) => ({ ...state, isLoading: true }));
        
        try {
          const { default: apiClient } = await import('../lib/api');
          const response = await apiClient.registerBuyer(data);
          
          set((state) => ({
            ...state,
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false
          }));
          
          apiClient.setToken(response.token);
        } catch (error) {
          set((state) => ({ ...state, isLoading: false }));
          throw error;
        }
      },
      registerSeller: async (data: RegisterData) => {
        set((state) => ({ ...state, isLoading: true }));
        
        try {
          const { default: apiClient } = await import('../lib/api');
          const response = await apiClient.registerSeller(data);
          
          // Create a pending verification for new sellers
          const pendingVerification: SellerVerification = {
            id: `verification_${Date.now()}`,
            user_id: response.user.id,
            status: 'pending',
            company_registration_document: '',
            submitted_at: new Date().toISOString()
          };

          const userWithVerification = {
            ...response.user,
            seller_verification: pendingVerification
          };
          
          set((state) => ({
            ...state,
            user: userWithVerification,
            token: response.token,
            isAuthenticated: true,
            isLoading: false
          }));
          
          apiClient.setToken(response.token);
        } catch (error) {
          set((state) => ({ ...state, isLoading: false }));
          throw error;
        }
      },
      logout: () => {
        set(() => ({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true
        }));
        
        // Update API client
        if (typeof window !== 'undefined') {
          import('../lib/api').then(({ default: apiClient }) => {
            apiClient.logout();
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
