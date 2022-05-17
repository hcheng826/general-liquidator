import { readFromHotCache, estimateProfitBeforeGas, updateHotCache, updateColdAndHotCache, getYetiStatus } from './stateMonitoring';
import { getLatestGasPrice, getPreComputedGasUnits } from './profitEvaluation';
import {
    getMempoolTxFromLogs,
    prepareAndOutBidLiquidateTx,
    sendTx,
    startMempoolStreaming,
} from './transactionSubmission';
import { init } from './config';
import { Position, YetiStatus } from './types';

let yetiStatus: YetiStatus;

async function main() {
    let epoch = 0;
    await init();
    await updateColdAndHotCache();
    yetiStatus = await getYetiStatus();
    while (true) {
        console.log('epoch:', epoch++);

        // state monitoring
        const positions: Array<Position> = readFromHotCache();
        let potentialPositions = new Array<Position>();
        for (let position of positions) {
            const profitBeforeGasFromPosition = estimateProfitBeforeGas(position, yetiStatus);
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
            const netProfit =
                // @ts-ignore
                position.profitBeforeGasFromPosition - gasUnits * gasPrice;
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

        await updateHotCache(positions);
    }
}

startMempoolStreaming();
main();

setInterval(
    updateColdAndHotCache,
    3000
);

setInterval(
    async () => { yetiStatus = await getYetiStatus(); },
    3000
);
