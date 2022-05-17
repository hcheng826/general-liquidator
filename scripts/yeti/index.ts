import {
    readFromHotCache,
    estimateProfitBeforeGas,
    updateHotCache,
    updateColdAndHotCache,
    getYetiStatus,
} from './stateMonitoring';
import { sendTransaction, startMempoolStreaming } from './transactionSubmission';
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
        /* NOTE: skip the step for gas estimation given that the 200 YUSD compensation >> gas fee on avalanche C-chain
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
        */
        let profitablePositions = potentialPositions;

        // transaction submission
        /* NOTE: Yeti allows batch liquidations. The original position-by-position design could be improved
        for (let position of profitablePositions) {
            const mempoolTxs = getMempoolTxFromLogs(position);
            const liquidateTx = prepareAndOutBidLiquidateTx(position, mempoolTxs);
            sendTx(liquidateTx);
        }
        */
        // TODO: add mempool optimization
        // const liquidateTx = prepareAndOutBidLiquidateTx(profitablePositions);
        sendTransaction(profitablePositions);

        await updateHotCache(positions);
    }
}

startMempoolStreaming();
main();

setInterval(async () => {
    await updateColdAndHotCache();
    yetiStatus = await getYetiStatus();
    positions = readFromHotCache();
}, 3000);
