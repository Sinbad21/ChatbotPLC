// ============================================
// REVIEW BOT TYPES
// ============================================

export type SurveyType = 'EMOJI' | 'STARS' | 'NPS';

export type EcommercePlatform = 'STRIPE' | 'WOOCOMMERCE' | 'SHOPIFY';

export type ReviewRequestStatus = 'PENDING' | 'SENT' | 'RESPONDED' | 'COMPLETED' | 'EXPIRED';

export type WidgetPosition = 'bottom-right' | 'bottom-left';

// ============================================
// REVIEW BOT
// ============================================

export interface ReviewBot {
  id: string;
  organizationId: string;
  widgetId: string;
  
  // Business info
  name: string;
  businessName: string;
  googlePlaceId?: string | null;
  googleReviewUrl?: string | null;
  
  // Messages
  thankYouMessage: string;
  surveyQuestion: string;
  positiveMessage: string;
  negativeMessage: string;
  completedMessage: string;
  
  // Survey config
  surveyType: SurveyType;
  positiveThreshold: number;
  
  // Widget styling
  widgetColor: string;
  widgetPosition: WidgetPosition;
  delaySeconds: number;
  autoCloseSeconds?: number | null;
  
  // Status
  isActive: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Relations
  ecommerceConnections?: EcommerceConnection[];
  
  // Computed stats
  totalRequests?: number;
  totalResponses?: number;
  totalPositive?: number;
  totalNegative?: number;
  totalGoogleClicks?: number;
  responseRate?: number;
  positiveRate?: number;
  googleClickRate?: number;
}

// ============================================
// ECOMMERCE CONNECTION
// ============================================

export interface EcommerceConnection {
  id: string;
  reviewBotId: string;
  
  platform: EcommercePlatform;
  shopDomain?: string | null;
  
  // Status
  isActive: boolean;
  lastSyncAt?: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================
// REVIEW REQUEST
// ============================================

export interface ReviewRequest {
  id: string;
  reviewBotId: string;
  sessionId: string;
  
  // Order info
  orderId?: string | null;
  orderAmount?: number | null;
  currency?: string | null;
  
  // Customer info
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  
  // Source
  platform: string;
  
  // Status
  status: ReviewRequestStatus;
  
  // Timestamps
  sentAt?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  responses?: ReviewResponse[];
}

// ============================================
// REVIEW RESPONSE
// ============================================

export interface ReviewResponse {
  id: string;
  reviewRequestId: string;
  
  // Rating
  rating: number;
  ratingType: string;
  
  // Feedback
  feedbackText?: string | null;
  
  // Google Review tracking
  clickedGoogleReview: boolean;
  googleClickedAt?: string | null;
  
  // Analytics
  userAgent?: string | null;
  ipAddress?: string | null;
  
  // Timestamp
  createdAt: string;
}

// ============================================
// WIDGET CONFIG (Public)
// ============================================

export interface WidgetConfig {
  widgetId: string;
  businessName: string;
  googleReviewUrl?: string | null;
  
  // Messages
  thankYouMessage: string;
  surveyQuestion: string;
  positiveMessage: string;
  negativeMessage: string;
  completedMessage: string;
  
  // Survey
  surveyType: SurveyType;
  positiveThreshold: number;
  
  // Widget
  widgetColor: string;
  widgetPosition: WidgetPosition;
  delaySeconds: number;
  autoCloseSeconds?: number | null;
  
  // Status
  isActive: boolean;
  hasResponded?: boolean;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ReviewBotListResponse extends ApiResponse<ReviewBot[]> {}

export interface ReviewBotResponse extends ApiResponse<ReviewBot> {}

export interface WidgetConfigResponse extends ApiResponse<WidgetConfig> {}

export interface SubmitRatingResponse extends ApiResponse<{
  responseId: string;
  isPositive: boolean;
  googleReviewUrl?: string | null;
  message: string;
}> {}

// ============================================
// WIZARD CONFIG
// ============================================

export interface ReviewBotWizardConfig {
  // Step 1: Business
  businessName: string;
  googlePlaceId: string;
  googleReviewUrl: string;
  
  // Step 2: eCommerce
  ecommercePlatform: '' | 'stripe' | 'woocommerce' | 'shopify';
  stripeWebhookSecret: string;
  wooUrl: string;
  wooConsumerKey: string;
  wooConsumerSecret: string;
  shopifyDomain: string;
  shopifyAccessToken: string;
  
  // Step 3: Messages
  thankYouMessage: string;
  surveyQuestion: string;
  positiveMessage: string;
  negativeMessage: string;
  completedMessage: string;
  
  // Step 4: Widget
  surveyType: SurveyType;
  positiveThreshold: number;
  widgetColor: string;
  widgetPosition: WidgetPosition;
  delaySeconds: number;
}

// ============================================
// STATS
// ============================================

export interface ReviewBotStats {
  totalRequests: number;
  totalResponses: number;
  responseRate: number;
  totalPositive: number;
  totalNegative: number;
  positiveRate: number;
  totalGoogleClicks: number;
  googleClickRate: number;
}

// ============================================
// ACTIVITY
// ============================================

export interface ReviewActivity {
  id: string;
  rating: number;
  customerName?: string;
  feedbackText?: string;
  clickedGoogleReview: boolean;
  createdAt: string;
}
