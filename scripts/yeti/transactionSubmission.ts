import { Position } from './types';

export function getMempoolTxFromLogs(position: Position) {}

// TODO: change "any" to the ethers transaction type
export function prepareAndOutBidLiquidateTx(position: Position, mempoolTxs: any) {}

// TODO: change "any" to the ethers transaction type
export function sendTx(Tx: any) {}

export function startMempoolStreaming() {
    // TODO: start the mempool straming following the snowsight example: https://docs.snowsight.chainsight.dev/snowsight/services/mempool-stream/ethers.js
    // idea: filter the transactions and write the transaction to log files by timestamp as filenames and clean the files prediotically
}
