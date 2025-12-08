/**
 * AI 선물 추천 마법사 타입 정의
 */

export interface GiftWizardAnswers {
  relationship: string
  age_range: string
  style: string
  interests: string[] | null
  occasion: string
  budget_min: number
  budget_max: number
  special_request: string | null
}

export interface GiftRecommendation {
  product_number: number
  product_id: string
  product_name: string
  product_price: number
  product_image: string
  product_rating: number
  product_review_count: number
  reasons: string[]
  messages: {
    emotional: string
    witty: string
    sincere: string
  }
  warnings?: string[]
}

export interface GiftRecommendationResponse {
  recommendations: GiftRecommendation[]
  packaging_tips: string
  delivery_tips: string
  overall_advice: string
}
