import {
    readFromHotCache,
    estimateProfitBeforeGas,
    updateHotCache,
    updateColdAndHotCache,
    getYetiStatus,
} from './stateMonitoring';
import { sendTransaction } from './transactionSubmission';
import { init } from './config';
import { Position, YetiStatus } from './types';

export async function main() {
    await init();
    await updateColdAndHotCache();

    let yetiStatus: YetiStatus;
    let positions: Array<Position>;
    let epoch = 0;
    let setIntervalCount = 0;

    setInterval(async () => {
        console.log('setIntervalCount', setIntervalCount++);
        await updateColdAndHotCache();
        yetiStatus = await getYetiStatus();
        positions = readFromHotCache();
    }, 10000);

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

        if (potentialPositions.length === 0) {
            continue;
        }
        console.log('liquidation opportunity detected!');

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
        const profitablePositions = potentialPositions;

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
        await sendTransaction(profitablePositions);
    }
}

main();
