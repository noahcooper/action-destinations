import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  fields as createOrUpdateIndividualConstituentFields,
  perform as performCreateOrUpdateIndividualConstituent
} from '../createOrUpdateIndividualConstituent'
import { BlackbaudSkyApi } from '../api'
import { Gift, GiftAcknowledgement, GiftReceipt } from '../types'
import { dateStringToFuzzyDate } from '../utils'

const fields = {
  acknowledgement: {
    label: 'Acknowledgement',
    description: 'The gift acknowledgement.',
    type: 'object',
    properties: {
      date: {
        label: 'Date',
        type: 'datetime'
      },
      status: {
        label: 'Status',
        type: 'string'
      }
    },
    default: {
      date: '',
      status: ''
    }
  },
  amount: {
    label: 'Gift Amount',
    description: 'The monetary amount of the gift.',
    type: 'object',
    required: true,
    properties: {
      value: {
        label: 'Value',
        type: 'number',
        required: true
      }
    },
    default: {
      value: {
        '@path': '$.properties.revenue'
      }
    }
  },
  check_date: {
    label: 'Check Date',
    description: 'The check date in ISO-8601 format.',
    type: 'datetime'
  },
  check_number: {
    label: 'Check Number',
    description: 'The check number.',
    type: 'string'
  },
  constituent_id: {
    label: 'Constituent ID',
    description: 'The ID of the constituent associated with the gift.',
    type: 'string'
  },
  date: {
    label: 'Gift Date',
    description: 'The gift date in ISO-8601 format.',
    type: 'datetime'
  },
  fund_id: {
    label: 'Fund ID',
    description: 'The ID of the fund associated with the gift.',
    type: 'string',
    required: true
  },
  gift_status: {
    label: 'Gift Status',
    description:
      'The status of the gift. Available values are "Active", "Held", "Terminated", "Completed", and "Cancelled".',
    type: 'string'
  },
  is_anonymous: {
    label: 'Is Anonymous',
    description: 'Indicates whether the gift is anonymous.',
    type: 'boolean'
  },
  linked_gifts: {
    label: 'Linked Gifts',
    description: 'The recurring gift associated with the payment being added.',
    type: 'array'
  },
  lookup_id: {
    label: 'Lookup ID',
    description: 'The organization-defined identifier for the gift.',
    type: 'string'
  },
  payment_method: {
    label: 'Payment Method',
    description:
      'The payment method. Available values are "Cash", "CreditCard", "PersonalCheck", "DirectDebit", "Other", "PayPal", or "Venmo".',
    type: 'string',
    required: true
  },
  post_date: {
    label: 'Post Date',
    description: 'The date that the gift was posted to general ledger in ISO-8601 format.',
    type: 'datetime'
  },
  post_status: {
    label: 'Post Status',
    description:
      'The general ledger post status of the gift. Available values are "Posted", "NotPosted", and "DoNotPost".',
    type: 'string'
  },
  receipt: {
    label: 'Receipt',
    description: 'The gift receipt.',
    type: 'object',
    properties: {
      date: {
        label: 'Date',
        type: 'datetime'
      },
      status: {
        label: 'Status',
        type: 'string'
      }
    },
    default: {
      date: '',
      status: ''
    }
  },
  recurring_gift_schedule: {
    label: 'Recurring Gift Schedule',
    description: 'The recurring gift schedule. When adding a recurring gift, a schedule is required.',
    type: 'object',
    properties: {
      end_date: {
        label: 'End Date',
        type: 'datetime'
      },
      frequency: {
        label: 'Frequency',
        type: 'string'
      },
      start_date: {
        label: 'Start Date',
        type: 'datetime'
      }
    },
    default: {
      end_date: '',
      frequency: '',
      start_date: ''
    }
  },
  subtype: {
    label: 'Subtype',
    description: 'The subtype of the gift.',
    type: 'string'
  },
  type: {
    label: 'Type',
    description:
      'The gift type. Available values are "Donation", "Other", "GiftInKind", "RecurringGift", and "RecurringGiftPayment".',
    type: 'string'
  }
}

// add constituent fields
Object.keys(createOrUpdateIndividualConstituentFields).forEach((key: string) => {
  fields['constituent_' + key] = {
    ...createOrUpdateIndividualConstituentFields[key],
    // prepend "Constituent" to label for clarity
    label: 'Constituent ' + createOrUpdateIndividualConstituentFields[key].label,
    constituentField: true
  }
})

const perform = async (request, { payload }) => {
  // check if request includes fields to create or update a constituent
  // if so, append them to a new payload
  const constituentPayload = {}
  Object.keys(payload).forEach((key: string) => {
    if (fields[key].constituentField) {
      // only append non-empty fields/objects
      if (payload[key] && (typeof payload[key] !== 'object' || Object.keys(payload[key]).length > 0)) {
        const excludedConstituentFields = ['constituent_lookup_id']
        if (!excludedConstituentFields.includes(key)) {
          constituentPayload[key.substring('constituent_'.length)] = payload[key]
        }
      }
    }
  })

  let constituentId = payload.constituent_id
  if (Object.keys(constituentPayload).length > 0) {
    // create or update constituent
    const createOrUpdateIndividualConstituentResponse = await performCreateOrUpdateIndividualConstituent(request, {
      payload: constituentPayload
    })
    constituentId = createOrUpdateIndividualConstituentResponse.id
  } else if (constituentId === undefined) {
    // constituent_id is required to create a gift
    // no constituent_id, throw an error
    throw new IntegrationError(`Missing constituent_id value`, 'MISSING_REQUIRED_FIELD', 400)
  }

  const blackbaudSkyApiClient: BlackbaudSkyApi = new BlackbaudSkyApi(request)

  // data for gift call
  const giftData: Gift = {
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

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Gift',
  description: "Create a Gift record in Raiser's Edge NXT.",
  defaultSubscription: 'type = "track" and event = "Donation Completed"',
  fields,
  perform
}

export default action
