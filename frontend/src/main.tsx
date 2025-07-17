import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import './index.css'
import App from './App.tsx'
import { wagmiConfig } from './config/wagmi'

// Global error handler for unhandled promise rejections (like CORS errors)
window.addEventListener('unhandledrejection', (event) => {
  // Check if it's a CORS or network error and suppress it
  if (event.reason?.message?.includes('CORS') || 
      event.reason?.message?.includes('NetworkError') ||
      event.reason?.message?.includes('fetch')) {
    console.warn('Network/CORS error suppressed:', event.reason);
    event.preventDefault(); // Prevent the error from crashing the app
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Don't retry on CORS or network errors
        if (error && typeof error === 'object' && 'message' in error) {
          const errorMessage = (error as { message: string }).message;
          if (errorMessage.includes('CORS') || 
              errorMessage.includes('NetworkError')) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          initialChain={undefined}
          showRecentTransactions={false}
        >
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
