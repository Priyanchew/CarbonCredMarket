/**
 * Request queue utility to handle sequential API requests after login
 * Ensures that the first few requests after login are processed sequentially
 * to avoid race conditions with token validation
 */

interface QueuedRequest {
  id: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class ApiRequestQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private isAuthenticating = false;
  private authenticationTime: number = 0;
  private readonly AUTH_GRACE_PERIOD = 2000; // 2 seconds after login

  /**
   * Add a request to the queue if we're in the authentication grace period
   * Otherwise execute immediately
   */
  async enqueue<T>(requestExecutor: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const shouldQueue = this.isAuthenticating || 
                       (this.authenticationTime > 0 && 
                        now - this.authenticationTime < this.AUTH_GRACE_PERIOD);

    if (!shouldQueue) {
      // Execute immediately if not in grace period
      return requestExecutor();
    }

    // Queue the request
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest = {
        id: Math.random().toString(36).substr(2, 9),
        execute: requestExecutor,
        resolve,
        reject
      };

      this.queue.push(request);
      this.processQueue();
    });
  }

  /**
   * Mark that authentication is starting
   */
  startAuthentication() {
    this.isAuthenticating = true;
    this.authenticationTime = 0;
  }

  /**
   * Mark that authentication has completed successfully
   */
  completeAuthentication() {
    this.isAuthenticating = false;
    this.authenticationTime = Date.now();
  }

  /**
   * Process the queue sequentially
   */
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      
      try {
        const result = await request.execute();
        request.resolve(result);
        
        // Small delay between requests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        request.reject(error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Clear the queue (e.g., on logout)
   */
  clear() {
    // Reject all pending requests
    this.queue.forEach(request => {
      request.reject(new Error('Request queue cleared'));
    });
    
    this.queue = [];
    this.isProcessing = false;
    this.isAuthenticating = false;
    this.authenticationTime = 0;
  }
}

export const apiRequestQueue = new ApiRequestQueue();
