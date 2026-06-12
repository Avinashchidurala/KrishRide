// Utility to store and retrieve post-login actions and context

export type PostLoginAction = 'BOOK_RIDE' | 'VIEW_RIDE' | null;

export interface RideContext {
  rideId: string;
  pickup?: string;
  drop?: string;
  date?: string;
  time?: string;
  initialPricePerSeat?: number; // Store initial price to detect fare changes
  filters?: {
    maxPrice?: number;
    minPrice?: number;
  };
}

const POST_LOGIN_ACTION_KEY = 'postLoginAction';
const RIDE_CONTEXT_KEY = 'rideContext';

/**
 * Store post-login action and ride context
 */
export const storePostLoginAction = (action: PostLoginAction, context?: RideContext): void => {
  if (action) {
    sessionStorage.setItem(POST_LOGIN_ACTION_KEY, action);
    if (context) {
      sessionStorage.setItem(RIDE_CONTEXT_KEY, JSON.stringify(context));
    }
  }
};

/**
 * Get and clear post-login action
 */
export const getPostLoginAction = (): { action: PostLoginAction; context: RideContext | null } => {
  const action = sessionStorage.getItem(POST_LOGIN_ACTION_KEY) as PostLoginAction;
  const contextStr = sessionStorage.getItem(RIDE_CONTEXT_KEY);
  const context = contextStr ? JSON.parse(contextStr) : null;

  // Clear after retrieval
  if (action) {
    sessionStorage.removeItem(POST_LOGIN_ACTION_KEY);
  }
  if (context) {
    sessionStorage.removeItem(RIDE_CONTEXT_KEY);
  }

  return { action, context };
};

/**
 * Clear post-login action (e.g., on explicit logout or after handling)
 */
export const clearPostLoginAction = (): void => {
  sessionStorage.removeItem(POST_LOGIN_ACTION_KEY);
  sessionStorage.removeItem(RIDE_CONTEXT_KEY);
};

