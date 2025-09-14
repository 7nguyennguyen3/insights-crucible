import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

// Enhanced API client with error handling, interceptors, and retry logic
const apiClient = axios.create({
  baseURL: "/api",
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and request modifications
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and response processing
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    // Enhanced error handling with user-friendly messages
    const errorMessage = getErrorMessage(error);
    const shouldShowToast = shouldShowErrorToast(error);
    
    // Log error details
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: errorMessage,
    });

    // Show user-friendly error toast for certain errors
    if (shouldShowToast) {
      toast.error('Request Failed', {
        description: errorMessage,
      });
    }

    return Promise.reject(error);
  }
);

// Extract user-friendly error messages
function getErrorMessage(error: AxiosError): string {
  if (error.response) {
    // Server responded with error status
    const data = error.response.data as any;
    
    if (data?.error) return data.error;
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
    
    switch (error.response.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please sign in.';
      case 403:
        return 'Permission denied. You don\'t have access to this resource.';
      case 404:
        return 'Resource not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service unavailable. Please try again later.';
      default:
        return `Request failed with status ${error.response.status}`;
    }
  } else if (error.request) {
    // Request made but no response received
    return 'Network error. Please check your connection and try again.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred.';
  }
}

// Determine if error toast should be shown
function shouldShowErrorToast(error: AxiosError): boolean {
  // Don't show toasts for certain endpoints or status codes
  const url = error.config?.url || '';
  const status = error.response?.status;
  
  // Skip toast for authentication errors (handled by auth flow)
  if (status === 401) return false;
  
  // Skip toast for specific endpoints that handle their own error display
  const skipToastEndpoints = [
    '/process-bulk',
    '/calculate-cost',
    '/youtube/metadata',
  ];
  
  if (skipToastEndpoints.some(endpoint => url.includes(endpoint))) {
    return false;
  }
  
  return true;
}

// Enhanced request methods with better typing
export const apiRequest = {
  get: <T = any>(url: string, config?: any) => 
    apiClient.get<T>(url, config),
  
  post: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.post<T>(url, data, config),
    
  put: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.put<T>(url, data, config),
    
  delete: <T = any>(url: string, config?: any) => 
    apiClient.delete<T>(url, config),
    
  patch: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.patch<T>(url, data, config),
};

// Retry utility for failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<AxiosResponse<T>>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<AxiosResponse<T>> => {
  let lastError: AxiosError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as AxiosError;
      
      // Don't retry on client errors (4xx) except for 429 (rate limit)
      const status = lastError.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw lastError;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying with exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      console.log(`Retrying request (attempt ${attempt + 1}/${maxRetries})`);
    }
  }
  
  throw lastError!;
};

export default apiClient;
