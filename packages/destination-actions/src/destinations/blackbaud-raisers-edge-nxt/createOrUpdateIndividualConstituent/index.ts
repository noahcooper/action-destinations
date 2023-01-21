import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const apiBaseUrl = 'https://api.sky.blackbaud.com/constituent/v1/'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Individual Constituent',
  description: "Create or update an Individual Constituent record in Raiser's Edge NXT.",
  defaultSubscription: 'type = "identify"',
  fields: {
    address: {
      label: 'Address',
      description: "The constituent's address.",
      type: 'object',
      properties: {
        address_lines: {
          label: 'Address Lines',
          type: 'string'
        },
        city: {
          label: 'City',
          type: 'string'
        },
        country: {
          label: 'Country',
          type: 'string'
        },
        do_not_mail: {
          label: 'Do Not Mail',
          type: 'boolean'
        },
        postal_code: {
          label: 'ZIP/Postal Code',
          type: 'string'
        },
        primary: {
          label: 'Is Primary',
          type: 'boolean'
        },
        state: {
          label: 'State/Province',
          type: 'string'
        },
        type: {
          label: 'Address Type',
          type: 'string'
        }
      }
    },
    // TODO: birthdate
    email: {
      label: 'Email',
      description: "The constituent's email address.",
      type: 'object',
      properties: {
        address: {
          label: 'Email Address',
          type: 'string'
        },
        do_not_email: {
          label: 'Do Not Email',
          type: 'boolean'
        },
        primary: {
          label: 'Is Primary',
          type: 'boolean'
        },
        type: {
          label: 'Email Type',
          type: 'string'
        }
      }
    },
    first: {
      label: 'First Name',
      description: "The constituent's first name up to 50 characters.",
      type: 'string',
      default: {
        '@if': {
          exists: {
            '@path': '$.traits.first_name'
          },
          then: {
            '@path': '$.traits.first_name'
          },
          else: {
            '@path': '$.properties.first_name'
          }
        }
      }
    },
    gender: {
      label: 'Gender',
      description: "The constituent's gender.",
      type: 'string',
      default: {
        '@if': {
          exists: {
            '@path': '$.traits.gender'
          },
          then: {
            '@path': '$.traits.gender'
          },
          else: {
            '@path': '$.properties.gender'
          }
        }
      }
    },
    income: {
      label: 'Income',
      description: "The constituent's income.",
      type: 'string'
    },
    last: {
      label: 'Last Name',
      description: "The constituent's last name up to 100 characters. This is required to create a constituent.",
      type: 'string',
      default: {
        '@if': {
          exists: {
            '@path': '$.traits.last_name'
          },
          then: {
            '@path': '$.traits.last_name'
          },
          else: {
            '@path': '$.properties.last_name'
          }
        }
      }
    },
    lookup_id: {
      label: 'Lookup ID',
      description: 'The organization-defined identifier for the constituent.',
      type: 'string'
    },
    online_presence: {
      label: 'Phone',
      description: "The constituent's online presence.",
      type: 'object',
      properties: {
        address: {
          label: 'Web Address',
          type: 'string'
        },
        primary: {
          label: 'Is Primary',
          type: 'boolean'
        },
        type: {
          label: 'Online Presence Type',
          type: 'string'
        }
      }
    },
    phone: {
      label: 'Phone',
      description: "The constituent's phone number.",
      type: 'object',
      properties: {
        do_not_call: {
          label: 'Do Not Call',
          type: 'boolean'
        },
        number: {
          label: 'Phone Number',
          type: 'string'
        },
        primary: {
          label: 'Is Primary',
          type: 'boolean'
        },
        type: {
          label: 'Phone Type',
          type: 'string'
        }
      }
    }
  },
  perform: async (request, { payload }) => {
    let constituentId = undefined
    if (payload.email?.address || payload.lookup_id) {
      let searchField = 'email_address'
      let searchText = payload.email?.address
      if (payload.lookup_id) {
        searchField = 'lookup_id'
        searchText = payload.lookup_id
      }
      const constituentSearchResponse = await request(
        `${apiBaseUrl}constituents/search?search_field=${searchField}&search_text=${searchText}`,
        {
          method: 'get'
        }
      )
      const constituentSearchResults = await constituentSearchResponse.json()
      if (constituentSearchResults.count > 1) {
        throw new IntegrationError('Multiple records returned for given traits', 'MULTIPLE_EXISTING_RECORDS', 400)
      } else if (constituentSearchResults.count === 1) {
        constituentId = constituentSearchResults.value[0].id
      } else if (constituentSearchResults.count !== 0) {
        throw new IntegrationError('Unexpected record count for given traits', 'UNEXPECTED_RECORD_COUNT', 400)
      }
    }
    const constituentData = {
      type: 'Individual'
    }
    const constituentFields = ['first', 'gender', 'income', 'last', 'lookup_id']
    constituentFields.forEach((key) => {
      if (payload[key] !== undefined) {
        constituentData[key] = payload[key]
      }
    })
    let constituentAddressData = undefined
    if (
      (payload.address?.address_lines ||
        payload.address?.city ||
        payload.address?.country ||
        payload.address?.postal_code ||
        payload.address?.state) &&
      payload.address?.type
    ) {
      constituentAddressData = payload.address
    }
    let constituentEmailData = undefined
    if (payload.email?.address && payload.email?.type) {
      constituentEmailData = payload.email
    }
    let constituentOnlinePresenceData = undefined
    if (payload.online_presence?.address && payload.online_presence?.type) {
      constituentOnlinePresenceData = payload.online_presence
    }
    let constituentPhoneData = undefined
    if (payload.phone?.number && payload.phone?.type) {
      constituentPhoneData = payload.phone
    }
    if (!constituentId) {
      if (!payload.last) {
        throw new IntegrationError('Missing last name value', 'MISSING_REQUIRED_FIELD', 400)
      } else {
        if (constituentAddressData) {
          constituentData.address = constituentAddressData
        }
        if (constituentEmailData) {
          constituentData.email = constituentEmailData
        }
        if (constituentOnlinePresenceData) {
          constituentData.online_presence = constituentOnlinePresenceData
        }
        if (constituentPhoneData) {
          constituentData.phone = constituentPhoneData
        }
        await request(`${apiBaseUrl}constituents`, {
          method: 'post',
          json: constituentData
        })
      }
    } else {
      await request(`${apiBaseUrl}constituents/${constituentId}`, {
        method: 'patch',
        json: constituentData
      })
      if (constituentAddressData) {
        const constituentAddressListResponse = await request(
          `${apiBaseUrl}constituents/${constituentId}/addresses?include_inactive=true`,
          {
            method: 'get'
          }
        )
        const constituentAddressListResults = await constituentAddressListResponse.json()
        let existingAddress = undefined
        if (constituentAddressListResults.count > 0) {
          existingAddress = constituentAddressListResults.value.filter((result) => {
            return (
              result.address_lines === constituentAddressData.address_lines &&
              result.city === constituentAddressData.city &&
              result.country === constituentAddressData.country &&
              result.postal_code === constituentAddressData.postal_code &&
              result.state === constituentAddressData.state
            )
          })
        }
        if (!existingAddress) {
          await request(`${apiBaseUrl}addresses`, {
            method: 'post',
            json: {
              ...constituentAddressData,
              constituent_id: constituentId,
              primary:
                constituentAddressData.primary ||
                (constituentAddressData.primary !== false && constituentAddressListResults.count === 0)
            }
          })
        } else {
          if (
            existingAddress.inactive ||
            constituentAddressData.do_not_mail !== existingAddress.do_not_mail ||
            constituentAddressData.primary !== existingAddress.primary ||
            constituentAddressData.type !== existingAddress.type
          ) {
            await request(`${apiBaseUrl}addresses/${existingAddress.id}`, {
              method: 'patch',
              json: {
                ...constituentAddressData,
                inactive: false
              }
            })
          }
        }
      }
      if (constituentEmailData) {
        const constituentEmailListResponse = await request(
          `${apiBaseUrl}constituents/${constituentId}/emailaddresses?include_inactive=true`,
          {
            method: 'get'
          }
        )
        const constituentEmailListResults = await constituentEmailListResponse.json()
        let existingEmail = undefined
        if (constituentEmailListResults.count > 0) {
          existingEmail = constituentEmailListResults.value.filter((result) => {
            return result.address === constituentEmailData.address
          })
        }
        if (!existingEmail) {
          await request(`${apiBaseUrl}emailaddresses`, {
            method: 'post',
            json: {
              ...constituentEmailData,
              constituent_id: constituentId,
              primary:
                constituentEmailData.primary ||
                (constituentEmailData.primary !== false && constituentEmailListResults.count === 0)
            }
          })
        } else {
          if (
            existingEmail.inactive ||
            constituentEmailData.do_not_email !== existingEmail.do_not_email ||
            constituentEmailData.primary !== existingEmail.primary ||
            constituentEmailData.type !== existingEmail.type
          ) {
            await request(`${apiBaseUrl}emailaddresses/${existingEmail.id}`, {
              method: 'patch',
              json: {
                ...constituentEmailData,
                inactive: false
              }
            })
          }
        }
      }
      if (constituentOnlinePresenceData) {
        const constituentOnlinePresenceListResponse = await request(
          `${apiBaseUrl}constituents/${constituentId}/onlinepresences?include_inactive=true`,
          {
            method: 'get'
          }
        )
        const constituentOnlinePresenceListResults = await constituentOnlinePresenceListResponse.json()
        let existingOnlinePresence = undefined
        if (constituentOnlinePresenceListResults.count > 0) {
          existingOnlinePresence = constituentOnlinePresenceListResults.value.filter((result) => {
            return result.address === constituentOnlinePresenceData.address
          })
        }
        if (!existingOnlinePresence) {
          await request(`${apiBaseUrl}onlinepresences`, {
            method: 'post',
            json: {
              ...constituentOnlinePresenceData,
              constituent_id: constituentId,
              primary:
                constituentOnlinePresenceData.primary ||
                (constituentOnlinePresenceData.primary !== false && constituentOnlinePresenceListResults.count === 0)
            }
          })
        } else {
          if (
            existingOnlinePresence.inactive ||
            constituentOnlinePresenceData.primary !== existingOnlinePresence.primary ||
            constituentOnlinePresenceData.type !== existingOnlinePresence.type
          ) {
            await request(`${apiBaseUrl}onlinepresences/${existingOnlinePresence.id}`, {
              method: 'patch',
              json: {
                ...constituentOnlinePresenceData,
                inactive: false
              }
            })
          }
        }
      }
      if (constituentPhoneData) {
        const constituentPhoneListResponse = await request(
          `${apiBaseUrl}constituents/${constituentId}/phones?include_inactive=true`,
          {
            method: 'get'
          }
        )
        const constituentPhoneListResults = await constituentPhoneListResponse.json()
        let existingPhone = undefined
        if (constituentPhoneListResults.count > 0) {
          existingPhone = constituentPhoneListResults.value.filter((result) => {
            return result.number === constituentPhoneData.number
          })
        }
        if (!existingPhone) {
          await request(`${apiBaseUrl}phones`, {
            method: 'post',
            json: {
              ...constituentPhoneData,
              constituent_id: constituentId,
              primary:
                constituentPhoneData.primary ||
                (constituentPhoneData.primary !== false && constituentPhoneListResults.count === 0)
            }
          })
        } else {
          if (
            existingPhone.inactive ||
            constituentPhoneData.do_not_call !== existingPhone.do_not_call ||
            constituentPhoneData.primary !== existingPhone.primary ||
            constituentPhoneData.type !== existingPhone.type
          ) {
            await request(`${apiBaseUrl}phones/${existingPhone.id}`, {
              method: 'patch',
              json: {
                ...constituentPhoneData,
                inactive: false
              }
            })
          }
        }
      }
      // TODO: return value
    }
  }
}

export default action
