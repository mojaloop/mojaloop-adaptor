import Knex from 'knex'
import Axios from 'axios'
import { createApp } from '../../src/adaptor'
import { Server } from 'hapi'
import { AdaptorServicesFactory } from '../factories/adaptor-services'
import { QuotesPostRequestFactory } from '../factories/mojaloop-messages'
import { KnexTransactionsService, TransactionState } from '../../src/services/transactions-service'
import { KnexIsoMessageService } from '../../src/services/iso-message-service'
import { KnexQuotesService } from '../../src/services/quotes-service'
import { ISO0100Factory } from '../factories/iso-messages'
import { Money } from '../../src/types/mojaloop'

jest.mock('uuid/v4', () => () => '123')

describe('Quotes endpoint', function () {
  let knex: Knex
  let adaptor: Server
  const services = AdaptorServicesFactory.build()
  const LPS_ID = 'postillion'
  let LPS_KEY: string

  const calculateAdaptorFees = async (amount: Money) => ({ amount: '2', currency: 'USD' })

  beforeAll(async () => {
    knex = Knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:',
        supportBigNumbers: true
      },
      useNullAsDefault: true
    })
    const httpClient = Axios.create()
    const fakeLogger = { log: jest.fn() }
    services.transactionsService = new KnexTransactionsService(knex, httpClient)
    services.transactionsService.sendToMojaHub = jest.fn().mockResolvedValue(undefined)
    services.isoMessagesService = new KnexIsoMessageService(knex)
    services.quotesService = new KnexQuotesService(knex, httpClient, 'secret', fakeLogger, 10000, calculateAdaptorFees)
    adaptor = await createApp(services)
  })

  beforeEach(async () => {
    await knex.migrate.latest()
    // send initial transfer request
    const iso0100 = ISO0100Factory.build({
      28: '1' // LPS fee
    })
    LPS_KEY = `${LPS_ID}-${iso0100[41]}-${iso0100[42]}`
    const response = await adaptor.inject({
      method: 'POST',
      url: '/iso8583/transactionRequests',
      payload: { lpsKey: LPS_KEY, lpsId: LPS_ID, ...iso0100 }
    })
    expect(response.statusCode).toBe(202)

    // response comes in to update transactionId
    const putTransactionRequestResponse = await adaptor.inject({
      method: 'PUT',
      url: '/transactionRequests/123',
      payload: {
        transactionId: '456',
        transactionRequestState: 'RECEIVED'
      }
    })
    expect(putTransactionRequestResponse.statusCode).toBe(200)
  })

  afterEach(async () => {
    await knex.migrate.rollback()
  })

  afterAll(async () => {
    await knex.destroy()
  })

  describe('POST', function () {
    test('retrieves transaction using quote requests transactionId', async () => {
      const getTransactionSpy = jest.spyOn(services.transactionsService, 'get')
      const quoteRequest = QuotesPostRequestFactory.build({
        transactionId: '456',
        amount: {
          amount: '100',
          currency: 'USD'
        }
      })

      const response = await adaptor.inject({
        method: 'POST',
        url: '/quotes',
        payload: quoteRequest
      })

      expect(response.statusCode).toBe(202)
      expect(getTransactionSpy).toHaveBeenCalledWith('456', 'transactionId')
    })

    test('creates quote with lpsFee and adaptor fee', async () => {
      const quoteRequest = QuotesPostRequestFactory.build({
        transactionId: '456',
        amount: {
          amount: '100',
          currency: 'USD'
        }
      })

      const response = await adaptor.inject({
        method: 'POST',
        url: '/quotes',
        payload: quoteRequest,
        headers: {
          'fspiop-source': 'payer',
          'fspiop-destination': 'payee'
        }
      })

      expect(response.statusCode).toBe(202)
      const quote = await services.quotesService.get(quoteRequest.quoteId, 'id')
      expect(quote.id).toBe(quoteRequest.quoteId)
      expect(quote.condition).toBeDefined()
      expect(quote.ilpPacket).toBeDefined()
      expect(quote.amount).toMatchObject({ amount: '100', currency: 'USD' })
      expect(quote.fees).toMatchObject({ amount: '1', currency: 'USD' })
      expect(quote.commission).toMatchObject({ amount: '2', currency: 'USD' })
      expect(quote.transferAmount).toMatchObject({ amount: '103', currency: 'USD' })
    })

    test('makes PUT request to mojaloop quotes endpoint', async () => {
      const quoteRequest = QuotesPostRequestFactory.build({
        transactionId: '456'
      })

      const response = await adaptor.inject({
        method: 'POST',
        url: '/quotes',
        payload: quoteRequest,
        headers: {
          'fspiop-source': 'payer',
          'fspiop-destination': 'payee'
        }
      })

      expect(response.statusCode).toBe(202)
      expect(services.MojaClient.putQuotes).toHaveBeenCalled()
    })

    test('updates transaction state to quoteResponded', async () => {
      const quoteRequest = QuotesPostRequestFactory.build({
        transactionId: '456'
      })

      const response = await adaptor.inject({
        method: 'POST',
        url: '/quotes',
        payload: quoteRequest,
        headers: {
          'fspiop-source': 'payer',
          'fspiop-destination': 'payee'
        }
      })

      expect(response.statusCode).toBe(202)
      const transaction = await services.transactionsService.get('456', 'transactionId')
      expect(transaction.state).toEqual(TransactionState.quoteResponded)
    })
  })

})
