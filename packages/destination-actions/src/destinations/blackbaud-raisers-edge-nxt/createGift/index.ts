import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createOrUpdateIndividualConstituentFields } from '../actionFields/createOrUpdateIndividualConstituent'
import { createGiftFields } from '../actionFields/createGift'
import { BlackbaudSkyApi } from '../api'
import { Gift, GiftAcknowledgement, GiftReceipt } from '../types'
import { dateStringToFuzzyDate } from '../utils'

const fields = {
  ...createGiftFields
}
Object.keys(createOrUpdateIndividualConstituentFields).forEach((key: string) => {
  fields['constituent_' + key] = createOrUpdateIndividualConstituentFields[key]
})

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Gift',
  description: "Create a Gift record in Raiser's Edge NXT.",
  defaultSubscription: 'type = "track" and event = "Donation Completed"',
  fields: fields,
  perform: async (request, { payload }) => {
    const blackbaudSkyApiClient: BlackbaudSkyApi = new BlackbaudSkyApi(request)

    // data for gift call
    const giftData: Gift = {}
    giftData.is_manual = true
    const simpleGiftFields = [
      'amount',
      'constituent_id',
      'date',
      'gift_status',
      'is_anonymous',
      'lookup_id',
      'post_date',
      'post_status',
      'subtype',
      'type'
    ]
    simpleGiftFields.forEach((key) => {
      if (payload[key] !== undefined) {
        giftData[key] = payload[key]
      }
    })

    // default type
    if (!giftData.type) {
      giftData.type = 'Donation'
    }

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

    // default post status and date
    if (!giftData.post_status) {
      giftData.post_status = 'NotPosted'
    }
    if ((giftData.post_status === 'NotPosted' || giftData.post_status === 'Posted') && !giftData.post_date) {
      giftData.post_date = payload.date
    }

    // create receipts array
    if (payload.receipt) {
      const receiptData: GiftReceipt = {
        status: payload.receipt.status || 'NEEDSRECEIPT'
      }
      if (receiptData.status !== 'NEEDSRECEIPT' && receiptData.status !== 'DONOTRECEIPT' && payload.receipt.date) {
        receiptData.date = payload.receipt.date
      }
      giftData.receipts = [receiptData]
    }

    // fields for recurring gifts
    if (giftData.type === 'RecurringGift') {
      giftData.recurring_gift_schedule = payload.recurring_gift_schedule
    } else if (giftData.type === 'RecurringGiftPayment') {
      giftData.linked_gifts = payload.linked_gifts
    }

    // create gift
    await blackbaudSkyApiClient.createGift(giftData)

    return
  }
}

export default action
