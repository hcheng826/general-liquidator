import { Position } from './types';
import { troveManagerContract } from './config';
import { ethers } from 'ethers';

export function getMempoolTxFromLogs(position: Position) {}

// TODO: change "any" to the ethers transaction type
export async function sendTransaction(positions: Array<Position>, mempoolTxs?: any) {
    const borrowerAddresses = positions.map((position) => position.borrowerAddress);
    const batchLiquidateTrovesTxRes = await troveManagerContract.batchLiquidateTroves(borrowerAddresses, await troveManagerContract.signer.getAddress());
    batchLiquidateTrovesTxRes.wait().then((rc: ethers.ContractReceipt) => {
        console.log(rc.transactionHash);
    });
}

export function startMempoolStreaming() {
    // TODO: start the mempool straming following the snowsight example: https://docs.snowsight.chainsight.dev/snowsight/services/mempool-stream/ethers.js
    // idea: filter the transactions and write the transaction to log files by timestamp as filenames and clean the files prediotically
}
