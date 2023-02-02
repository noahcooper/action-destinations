export interface RefreshTokenResponse {
  access_token: string
}

export interface FuzzyDate {
  d: string
  m: string
  y: string
}

export interface Constituent {
  address?: Address
  birthdate?: FuzzyDate
  email?: Email
  first?: string
  gender?: string
  income?: string
  last?: string
  lookup_id?: string
  online_presence?: OnlinePresence
  phone?: Phone
  type?: string
}

export interface Address {
  address_lines?: string
  city?: string
  country?: string
  do_not_mail?: boolean
  postal_code?: string
  primary?: boolean
  state?: string
  type?: string
}

export interface Email {
  address?: string
  do_not_email?: boolean
  primary?: boolean
  type?: string
}

export interface OnlinePresence {
  address?: string
  primary?: boolean
  type?: string
}

export interface Phone {
  do_not_call?: boolean
  number?: string
  primary?: boolean
  type?: string
}

export interface Gift {
  amount: GiftAmount
  constituent_id: string
  date: string | number
  gift_splits: GiftSplit[]
  gift_status?: string
  is_anonymous?: boolean
  is_manual: boolean
  linked_gifts?: string[]
  lookup_id?: string
  payments: GiftPayment[]
  post_date?: string | number
  post_status?: string
  recurring_gift_schedule?: RecurringGiftSchedule
  subtype?: string
  type: string
}

export interface GiftAmount {
  value: number
}

export interface GiftSplit {
  amount: string
  fund_id: string
}

export interface GiftPayment {
  check_date?: FuzzyDate
  check_number?: string
  payment_method: string
}

export interface RecurringGiftSchedule {
  end_date?: string | number
  frequency: string
  start_date: string | number
}
