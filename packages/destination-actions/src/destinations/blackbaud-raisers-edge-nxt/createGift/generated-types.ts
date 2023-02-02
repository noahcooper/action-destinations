// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The monetary amount of the gift.
   */
  amount: {
    value: string
  }
  /**
   * The check date in ISO-8601 format.
   */
  check_date?: string | number
  /**
   * The check number.
   */
  check_number?: string
  /**
   * The ID of the constituent associated with the gift.
   */
  constituent_id?: string
  /**
   * The gift date in ISO-8601 format.
   */
  date: string | number
  /**
   * The ID of the fund associated with the gift.
   */
  fund_id: string
  /**
   * The status of the gift. Available values are "Active", "Held", "Terminated", "Completed", and "Cancelled".
   */
  gift_status?: string
  /**
   * Indicates whether the gift is anonymous.
   */
  is_anonymous?: boolean
  /**
   * The organization-defined identifier for the gift.
   */
  lookup_id?: string
  /**
   * The payment method. Available values are "Cash", "CreditCard", "PersonalCheck", "DirectDebit", "Other", "PayPal", or "Venmo".
   */
  payment_method: string
  /**
   * The date that the gift was posted to general ledger in ISO-8601 format.
   */
  post_date?: string | number
  /**
   * The general ledger post status of the gift. Available values are "Posted", "NotPosted", and "DoNotPost".
   */
  post_status?: string
  /**
   * The recurring gift schedule. When adding a recurring gift, a schedule is required.
   */
  recurring_gift_schedule?: {
    end_date?: string | number
    frequency: string
    start_date: string | number
  }
  /**
   * The subtype of the gift.
   */
  subtype?: string
  /**
   * The gift type. Available values are "Donation", "Other", "GiftInKind", "RecurringGift", and "RecurringGiftPayment".
   */
  type?: string
}
