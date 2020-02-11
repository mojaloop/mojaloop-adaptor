import { AdaptorServices } from '../adaptor'
import { TransfersIDPutResponse } from '../types/mojaloop'
import { LegacyFinancialResponse } from '../types/adaptor-relay-messages'
import { TransferState } from '../services/transfers-service'
import { TransactionState } from '../services/transactions-service'

export async function transferResponseHandler ({ queueService, transactionsService, transfersService, logger }: AdaptorServices, transferResponse: TransfersIDPutResponse, headers: { [k: string]: any }, transferId: string): Promise<void> {
  try {
    if (transferResponse.transferState === TransferState.committed) {
      const transfer = await transfersService.get(transferId)
      const transaction = await transactionsService.get(transfer.transactionRequestId, 'transactionRequestId')
      const legacyFinancialResponse: LegacyFinancialResponse = {
        lpsFinancialRequestMessageId: 'lpsMessageId' // TODO: pull from transaction once DB and services are refactored.
      }

      await queueService.addToQueue(`${transaction.lpsId}FinancialResponses`, legacyFinancialResponse)

      await transactionsService.updateState(transaction.transactionRequestId, 'transactionRequestId', TransactionState.financialResponse)
    }
  } catch (error) {
    logger.error(`Transfer Response Handler: Could not process transfer response for transferId=${transferId} from ${headers['fspiop-source']}. ${error.message}`)
    // TODO: what should the adaptor do here? Start refund process?
  }
}