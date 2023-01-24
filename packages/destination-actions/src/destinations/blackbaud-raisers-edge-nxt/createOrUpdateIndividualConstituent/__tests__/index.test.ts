import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import { SKY_API_BASE_URL } from '../../constants'

const testDestination = createTestIntegration(Destination)

const identifyEventData: Partial<SegmentEvent> = {
  type: 'identify',
  traits: {
    address: {
      city: 'New York City',
      postal_code: '10108',
      state: 'NY',
      street: 'PO Box 963'
    },
    address_type: 'Home',
    email: 'john@example.biz',
    email_type: 'Personal',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+18774466722',
    phone_type: 'Home',
    website: 'https://www.facebook.com/john.doe',
    website_type: 'Facebook'
  }
}

const mapping = {
  properties: {
    address: {
      type: {
        '@path': '$.traits.address_type'
      }
    },
    email: {
      type: {
        '@path': '$.traits.email_type'
      }
    },
    lookup_id: {
      '@path': '$.traits.lookup_id'
    },
    online_presence: {
      type: {
        '@path': '$.traits.website_type'
      }
    },
    phone: {
      type: {
        '@path': '$.traits.phone_type'
      }
    }
  }
}

describe('BlackbaudRaisersEdgeNxt.createOrUpdateIndividualConstituent', () => {
  test('should create a new constituent successfully', async () => {
    const event = createTestEvent(identifyEventData)

    const constituentPayload = {
      address: {
        address_lines: 'PO Box 963',
        city: 'New York City',
        state: 'NY',
        postal_code: '10108',
        type: 'Home'
      },
      email: {
        address: 'john@example.biz',
        type: 'Personal'
      },
      first: 'John',
      last: 'Doe',
      online_presence: {
        address: 'https://www.facebook.com/john.doe',
        type: 'Facebook'
      },
      phone: {
        number: '+18774466722',
        type: 'Home'
      },
      type: 'Individual'
    }

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.biz')
      .reply(200, {
        count: 0,
        value: []
      })

    nock(SKY_API_BASE_URL).post('/constituents', constituentPayload).reply(200, {
      id: '123'
    })

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  test('should create a new constituent without email or lookup_id successfully', async () => {
    const identifyEventDataNoEmail: Partial<SegmentEvent> = {
      type: 'identify',
      traits: {
        first_name: 'John',
        last_name: 'Doe',
        phone: '+18774466722',
        phone_type: 'Home'
      }
    }

    const event = createTestEvent(identifyEventDataNoEmail)

    const constituentPayload = {
      first: 'John',
      last: 'Doe',
      phone: {
        number: '+18774466722',
        type: 'Home'
      },
      type: 'Individual'
    }

    nock(SKY_API_BASE_URL).post('/constituents', constituentPayload).reply(200, {
      id: '456'
    })

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  test('should update an existing constituent matched by email successfully', async () => {
    const identifyEventDataWithUpdates = {
      ...identifyEventData,
      traits: {
        ...identifyEventData.traits,
        address: {
          city: 'New York',
          postal_code: '10005',
          state: 'NY',
          street: '11 Wall St'
        },
        address_type: 'Work',
        email_type: 'Work',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+18774466723',
        phone_type: 'Work',
        website: 'https://www.example.biz',
        website_type: 'Website'
      }
    }

    const event = createTestEvent(identifyEventDataWithUpdates)

    const addressPayload = {
      address_lines: '11 Wall St',
      city: 'New York',
      state: 'NY',
      postal_code: '10005',
      type: 'Work'
    }

    const emailPayload = {
      address: 'john@example.biz',
      type: 'Work'
    }

    const onlinePresencePayload = {
      address: 'https://www.example.biz',
      type: 'Website'
    }

    const phonePayload = {
      number: '+18774466723',
      type: 'Work'
    }

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.biz')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '123',
            address: 'PO Box 963\r\nNew York City, NY 10108',
            email: 'john@example.biz',
            fundraiser_status: 'None',
            name: 'John Doe'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/addresses?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '1000',
            address_lines: 'PO Box 963',
            city: 'New York City',
            constituent_id: '123',
            date_added: '2023-01-01T01:01:01.000-05:00',
            date_modified: '2023-01-01T01:01:01.000-05:00',
            do_not_mail: false,
            formatted_address: 'PO Box 963\r\nNew York City, NY 10108',
            inactive: false,
            postal_code: '10108',
            preferred: true,
            state: 'NY',
            type: 'Home'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/addresses', {
        ...addressPayload,
        constituent_id: '123'
      })
      .reply(200, {
        id: '1001'
      })

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/emailaddresses?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '2000',
            address: 'john@example.biz',
            constituent_id: '123',
            date_added: '2023-01-01T01:01:01.000-05:00',
            date_modified: '2023-01-01T01:01:01.000-05:00',
            do_not_email: false,
            inactive: false,
            primary: true,
            type: 'Home'
          }
        ]
      })

    nock(SKY_API_BASE_URL).patch('/emailaddresses/9876', emailPayload).reply(200)

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/onlinepresences?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '3000',
            address: 'https://www.facebook.com/john.doe',
            constituent_id: '123',
            inactive: false,
            primary: true,
            type: 'Facebook'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/onlinepresences', {
        ...onlinePresencePayload,
        constituent_id: '123'
      })
      .reply(200, {
        id: '3001'
      })

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/phones?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '4000',
            constituent_id: '123',
            do_not_call: false,
            inactive: false,
            number: '+18774466722',
            primary: true,
            type: 'Home'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/phones', {
        ...phonePayload,
        constituent_id: '123'
      })
      .reply(200, {
        id: '4001'
      })

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  test('should update an existing constituent matched by lookup_id successfully', async () => {
    const identifyEventDataWithUpdates: Partial<SegmentEvent> = {
      type: 'identify',
      traits: {
        ...identifyEventData.traits,
        address: {
          city: 'New York',
          postal_code: '10005',
          state: 'NY',
          street: '11 Wall St'
        },
        address_type: 'Work',
        birthday: '2001-01-01T01:01:01-05:00',
        email: 'john.doe@aol.com',
        email_type: 'Personal',
        first_name: 'John',
        last_name: 'Doe',
        lookup_id: 'abcd1234'
      }
    }

    const event = createTestEvent(identifyEventDataWithUpdates)

    const constituentPayload = {
      birthdate: {
        d: '1',
        m: '1',
        y: '2001'
      },
      first: 'John',
      last: 'Doe',
      lookup_id: 'abcd1234'
    }

    const addressPayload = {
      address_lines: '11 Wall Street',
      city: 'New York',
      state: 'NY',
      postal_code: '10005',
      type: 'Work'
    }

    const emailPayload = {
      address: 'john.doe@aol.com',
      type: 'Personal'
    }

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=lookup_id&search_text=abcd1234')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '123',
            address: '11 Wall St\r\nNew York, NY 1005',
            email: 'john@example.biz',
            fundraiser_status: 'None',
            name: 'John Doe'
          }
        ]
      })

    nock(SKY_API_BASE_URL).patch('/constituents/123', constituentPayload).reply(200)

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/addresses?include_inactive=true')
      .reply(200, {
        count: 2,
        value: [
          {
            id: '1000',
            address_lines: 'PO Box 963',
            city: 'New York City',
            constituent_id: '123',
            date_added: '2023-01-01T01:01:01.000-05:00',
            date_modified: '2023-01-01T01:01:01.000-05:00',
            do_not_mail: false,
            formatted_address: 'PO Box 963\r\nNew York City, NY 10108',
            inactive: false,
            postal_code: '10108',
            preferred: true,
            state: 'NY',
            type: 'Home'
          },
          {
            id: '1001',
            address_lines: '11 Wall St',
            city: 'New York',
            constituent_id: '123',
            date_added: '2023-01-02T01:01:01.000-05:00',
            date_modified: '2023-01-02T01:01:01.000-05:00',
            do_not_mail: false,
            formatted_address: '11 Wall Street\r\nNew York, NY 10005',
            inactive: false,
            postal_code: '10005',
            preferred: true,
            state: 'NY',
            type: 'Work'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/addresses', {
        ...addressPayload,
        constituent_id: '123'
      })
      .reply(200, {
        id: '1002'
      })

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/emailaddresses?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '2000',
            address: 'john@example.biz',
            constituent_id: '123',
            date_added: '2023-01-01T01:01:01.000-05:00',
            date_modified: '2023-01-01T01:01:01.000-05:00',
            do_not_email: false,
            inactive: false,
            primary: true,
            type: 'Work'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/emailaddresses', {
        ...emailPayload,
        constituent_id: '123'
      })
      .reply(200, {
        id: '2001'
      })

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  test('should throw an IntegrationError if multiple records matched', async () => {
    const event = createTestEvent(identifyEventData)

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.biz')
      .reply(200, {
        count: 2,
        value: [
          {
            id: '123',
            address: '11 Wall Street\r\nNew York, NY 10005',
            email: 'john@example.biz',
            fundraiser_status: 'None',
            name: 'John Doe'
          },
          {
            id: '1234',
            address: '100 Main St\r\nLos Angeles, CA 90210',
            email: 'john@example.biz',
            fundraiser_status: 'None',
            name: 'John Doe'
          }
        ]
      })

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).rejects.toThrowError('Multiple records returned for given traits')
  })

  test('should throw a RetryableError if constituent search returns a 429', async () => {
    const identifyEventDataNoLastName: Partial<SegmentEvent> = {
      type: 'identify',
      traits: {
        email: 'john@example.org'
      }
    }

    const event = createTestEvent(identifyEventDataNoLastName)

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.org')
      .reply(429)

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).rejects.toThrowError('429 error returned when searching for constituent')
  })

  test('should throw an IntegrationError if new constituent has no last name', async () => {
    const identifyEventDataNoLastName: Partial<SegmentEvent> = {
      type: 'identify',
      traits: {
        email: 'john@example.org'
      }
    }

    const event = createTestEvent(identifyEventDataNoLastName)

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.org')
      .reply(200, {
        count: 0,
        value: []
      })

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).rejects.toThrowError('Missing last name value')
  })

  test('should throw an IntegrationError if one or more request returns a 400 when updating an existing constituent', async () => {
    const identifyEventDataWithUpdates = {
      ...identifyEventData,
      traits: {
        ...identifyEventData.traits,
        address: {
          city: 'New York',
          postal_code: '10005',
          state: 'NY',
          street: '11 Wall St'
        },
        address_type: 'Work',
        email_type: 'Work',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+18774466723',
        phone_type: 'Work',
        website: 'https://www.example.biz',
        website_type: 'Invalid'
      }
    }

    const event = createTestEvent(identifyEventDataWithUpdates)

    const addressPayload = {
      address_lines: '11 Wall St',
      city: 'New York',
      state: 'NY',
      postal_code: '10005',
      type: 'Work'
    }

    const emailPayload = {
      address: 'john@example.biz',
      type: 'Work'
    }

    const onlinePresencePayload = {
      address: 'https://www.example.biz',
      type: 'Website'
    }

    const phonePayload = {
      number: '+18774466723',
      type: 'Work'
    }

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.biz')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '123',
            address: 'PO Box 963\r\nNew York City, NY 10108',
            email: 'john@example.biz',
            fundraiser_status: 'None',
            name: 'John Doe'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/addresses?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '1000',
            address_lines: 'PO Box 963',
            city: 'New York City',
            constituent_id: '123',
            date_added: '2023-01-01T01:01:01.000-05:00',
            date_modified: '2023-01-01T01:01:01.000-05:00',
            do_not_mail: false,
            formatted_address: 'PO Box 963\r\nNew York City, NY 10108',
            inactive: false,
            postal_code: '10108',
            preferred: true,
            state: 'NY',
            type: 'Home'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/addresses', {
        ...addressPayload,
        constituent_id: '123'
      })
      .reply(200, {
        id: '1001'
      })

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/emailaddresses?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '2000',
            address: 'john@example.biz',
            constituent_id: '123',
            date_added: '2023-01-01T01:01:01.000-05:00',
            date_modified: '2023-01-01T01:01:01.000-05:00',
            do_not_email: false,
            inactive: false,
            primary: true,
            type: 'Home'
          }
        ]
      })

    nock(SKY_API_BASE_URL).patch('/emailaddresses/9876', emailPayload).reply(200)

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/onlinepresences?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '3000',
            address: 'https://www.facebook.com/john.doe',
            constituent_id: '123',
            inactive: false,
            primary: true,
            type: 'Facebook'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/onlinepresences', {
        ...onlinePresencePayload,
        constituent_id: '123'
      })
      .reply(400)

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/phones?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '4000',
            constituent_id: '123',
            do_not_call: false,
            inactive: false,
            number: '+18774466722',
            primary: true,
            type: 'Home'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/phones', {
        ...phonePayload,
        constituent_id: '123'
      })
      .reply(200, {
        id: '4001'
      })

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(
      'One or more errors occurred when updating existing constituent: Error occurred when updating constituent online presence'
    )
  })

  test('should throw a RetryableError if one or more request returns a 429 when updating an existing constituent', async () => {
    const identifyEventDataWithUpdates = {
      ...identifyEventData,
      traits: {
        ...identifyEventData.traits,
        address: {
          city: 'New York',
          postal_code: '10005',
          state: 'NY',
          street: '11 Wall St'
        },
        address_type: 'Work',
        email_type: 'Work',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+18774466723',
        phone_type: 'Work',
        website: 'https://www.example.biz',
        website_type: 'Website'
      }
    }

    const event = createTestEvent(identifyEventDataWithUpdates)

    const addressPayload = {
      address_lines: '11 Wall St',
      city: 'New York',
      state: 'NY',
      postal_code: '10005',
      type: 'Work'
    }

    nock(SKY_API_BASE_URL)
      .get('/constituents/search?search_field=email_address&search_text=john@example.biz')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '123',
            address: 'PO Box 963\r\nNew York City, NY 10108',
            email: 'john@example.biz',
            fundraiser_status: 'None',
            name: 'John Doe'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .get('/constituents/123/addresses?include_inactive=true')
      .reply(200, {
        count: 1,
        value: [
          {
            id: '1000',
            address_lines: 'PO Box 963',
            city: 'New York City',
            constituent_id: '123',
            date_added: '2023-01-01T01:01:01.000-05:00',
            date_modified: '2023-01-01T01:01:01.000-05:00',
            do_not_mail: false,
            formatted_address: 'PO Box 963\r\nNew York City, NY 10108',
            inactive: false,
            postal_code: '10108',
            preferred: true,
            state: 'NY',
            type: 'Home'
          }
        ]
      })

    nock(SKY_API_BASE_URL)
      .post('/addresses', {
        ...addressPayload,
        constituent_id: '123'
      })
      .reply(200, {
        id: '1001'
      })

    nock(SKY_API_BASE_URL).get('/constituents/123/emailaddresses?include_inactive=true').reply(429)

    nock(SKY_API_BASE_URL).get('/constituents/123/onlinepresences?include_inactive=true').reply(429)

    nock(SKY_API_BASE_URL).get('/constituents/123/phones?include_inactive=true').reply(429)

    await expect(
      testDestination.testAction('createOrUpdateIndividualConstituent', {
        event,
        mapping,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(
      'One or more errors occurred when updating existing constituent: 429 error occurred when updating constituent email, 429 error occurred when updating constituent online presence, 429 error occurred when updating constituent phone'
    )
  })
})
