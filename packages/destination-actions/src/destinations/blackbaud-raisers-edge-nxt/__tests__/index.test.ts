import nock from 'nock'
// import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe("Blackbaud Raiser's Edge NXT", () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://your.destination.endpoint').get('*').reply(200, {})

      const settings = {
        bbApiSubscriptionKey: 'subscription_key'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })
})
