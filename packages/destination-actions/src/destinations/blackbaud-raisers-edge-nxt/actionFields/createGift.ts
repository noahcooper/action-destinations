export const createGiftFields = {
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
    type: 'datetime',
    required: true
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
