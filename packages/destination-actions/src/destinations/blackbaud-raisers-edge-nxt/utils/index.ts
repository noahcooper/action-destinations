import {
  Address,
  Constituent,
  Email,
  Gift,
  GiftAcknowledgement,
  GiftReceipt,
  OnlinePresence,
  Phone,
  StringIndexedObject
} from '../types'
import { Payload as CreateOrUpdateIndividualConstituentPayload } from '../createOrUpdateIndividualConstituent/generated-types'
import { Payload as CreateGiftPayload } from '../createGift/generated-types'

export const dateStringToFuzzyDate = (dateString: string | number) => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    // invalid date object
    return false
  } else {
    // valid date object
    // convert date to a "Fuzzy date"
    // https://developer.blackbaud.com/skyapi/renxt/constituent/entities#FuzzyDate
    return {
      d: date.getDate().toString(),
      m: (date.getMonth() + 1).toString(),
      y: date.getFullYear().toString()
    }
  }
}

export const splitConstituentPayload = (payload: CreateOrUpdateIndividualConstituentPayload) => {
  const constituentData: Partial<Constituent> = {}
  const simpleConstituentFields = ['first', 'gender', 'income', 'last', 'lookup_id']
  simpleConstituentFields.forEach((key: string) => {
    if (payload[key] !== undefined) {
      constituentData[key] = payload[key]
    }
  })
  if (payload.birthdate) {
    const birthdateFuzzyDate = dateStringToFuzzyDate(payload.birthdate)
    if (birthdateFuzzyDate) {
      constituentData.birthdate = birthdateFuzzyDate
    }
  }

  let addressData: Partial<Address> = {}
  if (
    payload.address &&
    (payload.address.address_lines ||
      payload.address.city ||
      payload.address.country ||
      payload.address.postal_code ||
      payload.address.state) &&
    payload.address.type
  ) {
    addressData = payload.address
  }

  let emailData: Partial<Email> = {}
  if (payload.email && payload.email.address && payload.email.type) {
    emailData = payload.email
  }

  let onlinePresenceData: Partial<OnlinePresence> = {}
  if (payload.online_presence && payload.online_presence.address && payload.online_presence.type) {
    onlinePresenceData = payload.online_presence
  }

  let phoneData: Partial<Phone> = {}
  if (payload.phone && payload.phone.number && payload.phone.type) {
    phoneData = payload.phone
  }

  return [constituentData, addressData, emailData, onlinePresenceData, phoneData]
}

export const buildConstituentPayloadFromGiftPayload = (payload: CreateGiftPayload) => {
  // check if request includes fields to create or update a constituent
  // if so, append them to a new payload
  const constituentPayload = {}
  Object.keys(payload).forEach((key: string) => {
    if (key.startsWith('constituent_')) {
      // only append non-empty fields/objects
      if (payload[key] && (typeof payload[key] !== 'object' || Object.keys(payload[key]).length > 0)) {
        const excludedConstituentFields = ['constituent_id', 'constituent_lookup_id']
        if (!excludedConstituentFields.includes(key)) {
          constituentPayload[key.substring('constituent_'.length)] = payload[key]
        }
      }
    }
  })
  return constituentPayload
}

export const buildGiftDataFromPayload = (constituentId: string, payload: CreateGiftPayload) => {
  // data for gift call
  const giftData: Partial<Gift> = {
    constituent_id: constituentId,
    // hardcode is_manual
    is_manual: true
  }
  const simpleGiftFields = [
    'amount',
    'date',
    'gift_status',
    'is_anonymous',
    'lookup_id',
    'post_date',
    'post_status',
    'subtype',
    'type'
  ]
  simpleGiftFields.forEach((key: string) => {
    if (payload[key] !== undefined) {
      giftData[key] = payload[key]
    }
  })

  // default date
  giftData.date = giftData.date || new Date().toISOString()

  // create acknowledgements array
  if (payload.acknowledgement) {
    const acknowledgementData: GiftAcknowledgement = {
      status: payload.acknowledgement.status || 'NEEDSACKNOWLEDGEMENT'
    }
    if (
      acknowledgementData.status !== 'NEEDSACKNOWLEDGEMENT' &&
      acknowledgementData.status !== 'DONOTACKNOWLEDGE' &&
      payload.acknowledgement.date
    ) {
      acknowledgementData.date = payload.acknowledgement.date
    }
    giftData.acknowledgements = [acknowledgementData]
  }

  // create gift splits array
  giftData.gift_splits = [
    {
      amount: giftData.amount,
      fund_id: payload.fund_id
    }
  ]

  // create payments array
  giftData.payments = [
    {
      payment_method: payload.payment_method
    }
  ]

  // fields for check gifts
  if (giftData.payments[0].payment_method === 'PersonalCheck') {
    giftData.payments[0].check_number = payload.check_number
    if (payload.check_date) {
      const checkDateFuzzyDate = dateStringToFuzzyDate(payload.check_date)
      if (checkDateFuzzyDate) {
        giftData.payments[0].check_date = checkDateFuzzyDate
      }
    }
  }

  // default post date
  if ((giftData.post_status === 'NotPosted' || giftData.post_status === 'Posted') && !giftData.post_date) {
    giftData.post_date = payload.date
  }

  // create receipts array
  if (payload.receipt) {
    const receiptData: GiftReceipt = {
      status: payload.receipt.status || 'NEEDSRECEIPT'
    }
    if (receiptData.status === 'RECEIPTED' && payload.receipt.date) {
      receiptData.date = payload.receipt.date
    }
    giftData.receipts = [receiptData]
  }

  // fields for recurring gifts
  if (giftData.type === 'RecurringGift') {
    giftData.recurring_gift_schedule = payload.recurring_gift_schedule
  } else if (giftData.type === 'RecurringGiftPayment' && payload.linked_gifts) {
    giftData.linked_gifts = [payload.linked_gifts.split(',')]
  }

  return giftData
}

export const filterObjectListByMatchFields = (
  list: StringIndexedObject[],
  data: StringIndexedObject,
  matchFields: string[]
) => {
  return list.find((item: StringIndexedObject) => {
    let isMatch: boolean | undefined = undefined
    matchFields.forEach((field: string) => {
      if (isMatch !== false) {
        let fieldName = field
        if (field.startsWith('int:')) {
          fieldName = field.split('int:')[1]
        }
        let itemValue = item[fieldName] ? item[fieldName].toLowerCase() : ''
        let dataValue = data[fieldName] ? data[fieldName].toLowerCase() : ''
        if (field.startsWith('int:')) {
          itemValue = itemValue.replace(/\D/g, '')
          dataValue = dataValue.replace(/\D/g, '')
        }
        isMatch = itemValue === dataValue
      }
    })
    return isMatch
  })
}

export const isRequestErrorRetryable = (statusCode: number) => {
  return statusCode === 429 || statusCode >= 500
}
