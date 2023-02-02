import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import { SKY_API_CONSTITUENT_URL, SKY_API_GIFTS_URL } from '../constants'

export class BlackbaudSkyApi {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  async getExistingConstituents(searchField: string, searchText: string): Promise<ModifiedResponse> {
    return this.request(
      `${SKY_API_CONSTITUENT_URL}/constituents/search?search_field=${searchField}&search_text=${searchText}`,
      {
        method: 'get'
      }
    )
  }

  async createConstituent(constituentData: object): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/constituents`, {
      method: 'post',
      json: constituentData
    })
  }

  async updateConstituent(constituentId: string, constituentData: object): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/constituents/${constituentId}`, {
      method: 'patch',
      json: constituentData,
      throwHttpErrors: false
    })
  }

  async getConstituentAddressList(constituentId: string): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/constituents/${constituentId}/addresses?include_inactive=true`, {
      method: 'get',
      throwHttpErrors: false
    })
  }

  async createConstituentAddress(constituentId: string, constituentAddressData: object): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/addresses`, {
      method: 'post',
      json: {
        ...constituentAddressData,
        constituent_id: constituentId
      },
      throwHttpErrors: false
    })
  }

  async updateConstituentAddressById(addressId: string, constituentAddressData: object): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/addresses/${addressId}`, {
      method: 'patch',
      json: {
        ...constituentAddressData,
        inactive: false
      },
      throwHttpErrors: false
    })
  }

  async getConstituentEmailList(constituentId: string): Promise<ModifiedResponse> {
    return this.request(
      `${SKY_API_CONSTITUENT_URL}/constituents/${constituentId}/emailaddresses?include_inactive=true`,
      {
        method: 'get',
        throwHttpErrors: false
      }
    )
  }

  async createConstituentEmail(constituentId: string, constituentEmailData: object): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/emailaddresses`, {
      method: 'post',
      json: {
        ...constituentEmailData,
        constituent_id: constituentId
      },
      throwHttpErrors: false
    })
  }

  async updateConstituentEmailById(emailId: string, constituentEmailData: object): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/emailaddresses/${emailId}`, {
      method: 'patch',
      json: {
        ...constituentEmailData,
        inactive: false
      },
      throwHttpErrors: false
    })
  }

  async getConstituentOnlinePresenceList(constituentId: string): Promise<ModifiedResponse> {
    return this.request(
      `${SKY_API_CONSTITUENT_URL}/constituents/${constituentId}/onlinepresences?include_inactive=true`,
      {
        method: 'get',
        throwHttpErrors: false
      }
    )
  }

  async createConstituentOnlinePresence(
    constituentId: string,
    constituentOnlinePresenceData: object
  ): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/onlinepresences`, {
      method: 'post',
      json: {
        ...constituentOnlinePresenceData,
        constituent_id: constituentId
      },
      throwHttpErrors: false
    })
  }

  async updateConstituentOnlinePresenceById(
    onlinePresenceId: string,
    constituentOnlinePresenceData: object
  ): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/onlinepresences/${onlinePresenceId}`, {
      method: 'patch',
      json: {
        ...constituentOnlinePresenceData,
        inactive: false
      },
      throwHttpErrors: false
    })
  }

  async getConstituentPhoneList(constituentId: string): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/constituents/${constituentId}/phones?include_inactive=true`, {
      method: 'get',
      throwHttpErrors: false
    })
  }

  async createConstituentPhone(constituentId: string, constituentPhoneData: object): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/phones`, {
      method: 'post',
      json: {
        ...constituentPhoneData,
        constituent_id: constituentId
      },
      throwHttpErrors: false
    })
  }

  async updateConstituentPhoneById(phoneId: string, constituentPhoneData: object): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_CONSTITUENT_URL}/phones/${phoneId}`, {
      method: 'patch',
      json: {
        ...constituentPhoneData,
        inactive: false
      },
      throwHttpErrors: false
    })
  }

  async getConstituentGiftList(
    constituentId: string,
    fundId: string,
    giftAmount: string,
    giftDate: string
  ): Promise<ModifiedResponse> {
    return this.request(
      `${SKY_API_GIFTS_URL}/gift/v1/gifts?constituent_id=${constituentId}&fund_id=${fundId}&start_gift_amount=${giftAmount}&end_gift_date=${giftAmount}&start_gift_date=${giftDate}&end_gift_date=${giftDate}`,
      {
        method: 'get'
      }
    )
  }

  async createGift(giftData: object): Promise<ModifiedResponse> {
    return this.request(`${SKY_API_GIFTS_URL}/gift/v1/gifts`, {
      method: 'post',
      json: giftData
    })
  }
}
