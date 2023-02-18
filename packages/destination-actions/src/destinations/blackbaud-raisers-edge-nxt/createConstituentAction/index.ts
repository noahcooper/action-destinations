import { ActionDefinition, ExecuteInput, InputField, IntegrationError, RequestFn } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from '../createConstituentAction/generated-types'
import {
  fields as createOrUpdateIndividualConstituentFields,
  perform as performCreateOrUpdateIndividualConstituent
} from '../createOrUpdateIndividualConstituent'
import { BlackbaudSkyApi } from '../api'
import { ConstituentAction, StringIndexedObject } from '../types'
import { buildConstituentActionDataFromPayload, buildConstituentPayloadFromPayload } from '../utils'

const fields: Record<string, InputField> = {
  constituent_id: {
    label: 'Constituent ID',
    description: 'The ID of the constituent associated with the action.',
    type: 'string'
  },
  date: {
    label: 'Date',
    description: 'The action date in ISO-8601 format.',
    type: 'datetime',
    required: true,
    default: {
      '@path': '$.timestamp'
    }
  },
  category: {
    label: 'Category',
    description:
      'The channel or intent of the constituent interaction. Available values are Phone Call, Meeting, Mailing, Email, and Task/Other.',
    type: 'string',
    required: true
  },
  completed: {
    label: 'Completed',
    description: 'Indicates whether the action is complete.',
    type: 'boolean'
  },
  completed_date: {
    label: 'Completed Date',
    description: 'The date when the action was completed in ISO-8601 format.',
    type: 'datetime'
  },
  description: {
    label: 'Description',
    description: 'The detailed explanation that elaborates on the action summary.',
    type: 'string'
  },
  direction: {
    label: 'Direction',
    description: 'The direction of the action. Available values are "Inbound" and "Outbound". The default is Inbound.',
    type: 'string',
    default: 'Inbound'
  },
  end_time: {
    label: 'End Time',
    description: 'The end time of the action. Uses 24-hour time in the HH:mm format.',
    type: 'string'
  },
  fundraisers: {
    label: 'Fundraisers',
    description: 'The set of immutable constituent system record IDs for the fundraisers associated with the action.',
    type: 'string'
  },
  location: {
    label: 'Location',
    description: 'The location of the action. Available values are the entries in the Action Locations table.',
    type: 'string'
  },
  opportunity_id: {
    label: 'Opportunity ID',
    description: 'The immutable system record ID of the opportunity associated with the action.',
    type: 'string'
  },
  outcome: {
    label: 'Outcome',
    description: 'The outcome of the action. Available values are Successful and Unsuccessful.',
    type: 'string'
  },
  priority: {
    label: 'Priority',
    description: 'The priority of the action. Available values are Normal, High, and Low. The default is Normal.',
    type: 'string',
    default: 'Normal'
  },
  start_time: {
    label: 'Start Time',
    description: 'The start time of the action. Uses 24-hour time in the HH:mm format.',
    type: 'string'
  },
  status: {
    label: 'Status',
    description:
      'The action status. If the system is configured to use custom action statuses, available values are the entries in the Action Status table.',
    type: 'string'
  },
  summary: {
    label: 'Summary',
    description: 'The short description of the action that appears at the top of the record. Character limit: 255.',
    type: 'string'
  },
  type: {
    label: 'Type',
    description:
      'Additional description of the action to complement the category. Available values are the entries in the Actions table.',
    type: 'string'
  },
  author: {
    label: 'Author',
    description:
      "The author of the action's summary and description. If not supplied, will have a default set based on the user's account. Character limit: 50.",
    type: 'string'
  }
}

Object.keys(createOrUpdateIndividualConstituentFields).forEach((key: string) => {
  let fieldKey = 'constituent_' + key
  let fieldLabel = 'Constituent ' + createOrUpdateIndividualConstituentFields[key].label
  if (key === 'constituent_id') {
    fieldKey = key
    fieldLabel = createOrUpdateIndividualConstituentFields[key].label
  }
  fields[fieldKey] = {
    ...createOrUpdateIndividualConstituentFields[key],
    label: fieldLabel
  }
})

const perform: RequestFn<Settings, Payload> = async (request, { settings, payload }) => {
  // Refactor this into a method that createGift can use as well
  const constituentPayload = buildConstituentPayloadFromPayload(payload as StringIndexedObject)

  let constituentId = payload.constituent_id
  if (Object.keys(constituentPayload).length > 0) {
    const createOrUpdateIndividualConstituentResponse = await performCreateOrUpdateIndividualConstituent(request, {
      settings: settings,
      payload: constituentPayload
    } as ExecuteInput<Settings, Payload>)
    constituentId = createOrUpdateIndividualConstituentResponse.id
  } else if (constituentId === undefined) {
    throw new IntegrationError('Missing constituent_id value', 'MISSING_REQUIRED_FIELD', 400)
  }

  const blackbaudSkyApiClient: BlackbaudSkyApi = new BlackbaudSkyApi(request)

  const constituentActionData = buildConstituentActionDataFromPayload(
    constituentId as string,
    payload
  ) as ConstituentAction

  return blackbaudSkyApiClient.createConstituentAction(constituentActionData)
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Constituent Action',
  description: "Create a Constituent Action record in Raiser's Edge NXT.",
  fields,
  perform
}

export default action
