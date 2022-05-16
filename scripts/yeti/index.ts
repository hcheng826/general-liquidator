import { readFromHotCache, queryStateByPositions, estimateProfitBeforeGas, updateHotCache, updateColdCache } from './stateMonitoring';
import { getLatestGasPrice, getPreComputedGasUnits } from './profitEvaluation';
import { getMempoolTxFromLogs, prepareAndOutBidLiquidateTx, sendTx, startMempoolStreaming } from './transactionSubmission';
import { init } from './init';
import { Position } from './types';

async function main() {
    let epoch = 0;
    await init();
    await updateColdCache();
    while(false) {
        updateHotCache();
        console.log('epoch:', epoch++);
        // state monitoring
        const positions: Array<Position> = readFromHotCache();
        const updatedPositions: Array<Position> = queryStateByPositions(positions);
        let potentialPositions = new Array<Position>();
        for (let position of updatedPositions) {
            const profitBeforeGasFromPosition = estimateProfitBeforeGas(position);
            if (profitBeforeGasFromPosition > 0) {
                position.profitBeforeGasFromPosition = profitBeforeGasFromPosition;
                potentialPositions.push(position);
            }
        }

        // net profit evaluation
        const gasPrice = getLatestGasPrice();
        let profitablePositions = new Array<Position>();
        for (let position of potentialPositions) {
            const gasUnits = getPreComputedGasUnits(position);
            // @ts-ignore
            const netProfit = position.profitBeforeGasFromPosition - gasUnits * gasPrice;
            if (netProfit > 0) {
                position.netProfit = netProfit;
                profitablePositions.push(position);
            }
        }

        // transaction submission
        for (let position of profitablePositions) {
            const mempoolTxs = getMempoolTxFromLogs(position);
            const liquidateTx = prepareAndOutBidLiquidateTx(position, mempoolTxs);
            sendTx(liquidateTx);
        }
    }
}

startMempoolStreaming();
main();

// setInterval(
//     updateColdCache,
//     3000
// );
