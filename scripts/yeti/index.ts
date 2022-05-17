import {
    readFromHotCache,
    estimateProfitBeforeGas,
    updateHotCache,
    updateColdAndHotCache,
    getYetiStatus,
} from './stateMonitoring';
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
let positions: Array<Position>;

async function main() {
    let epoch = 0;
    await init();
    await updateColdAndHotCache();
    yetiStatus = await getYetiStatus();
    positions = readFromHotCache();
    while (true) {
        console.log('epoch:', epoch++);

        // state monitoring
        positions = await updateHotCache(positions);
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
    }
}

startMempoolStreaming();
main();

setInterval(async () => {
    await updateColdAndHotCache();
    yetiStatus = await getYetiStatus();
    positions = readFromHotCache();
}, 3000);
