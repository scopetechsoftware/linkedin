import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { AuthProvider } from './context/AuthContext.jsx';

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

// Create a custom storage object that uses localStorage
const createLocalStoragePersister = () => {
  return {
    getItem: (key) => {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : null;
    },
    setItem: (key, value) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
    }
  };
};

// Create a custom persister
const localStoragePersister = createLocalStoragePersister();

// Create a query client with persistence
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      // Add a custom persister to each query
      onSuccess: (data, query) => {
        // Only persist chat-related queries
        if (query.queryKey[0] === 'chats' || query.queryKey[0] === 'chatMessages') {
          const key = `query-${query.queryKey.join('-')}`;
          localStoragePersister.setItem(key, data);
        }
      }
    },
  },
});

// Add a custom hook to hydrate queries from localStorage
const hydrateQueriesFromLocalStorage = () => {
  // Get all keys from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('query-')) {
      const queryKeyString = key.replace('query-', '');
      const queryKey = queryKeyString.split('-');
      const data = localStoragePersister.getItem(key);
      if (data) {
        // Set the data in the query cache
        queryClient.setQueryData(queryKey, data);
      }
    }
  }
};

// Hydrate queries when the app loads
hydrateQueriesFromLocalStorage();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RecoilRoot>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </RecoilRoot>
  </StrictMode>,
)




