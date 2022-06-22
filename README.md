# General-Liquidator

A general liquidate workflow that applies to all kinds of liquidation (or could expand to arbitrage, reinvest). User
just needs to implement each coponent and the workflow serves as a platform that execute each step.

### Established Case

- Yeti: The workflow monitors the positions (troves) on the Yeti protocol and send liquidation requests when there is any liquidation opportunities.

## Components

### Monitoring

1. Query data
    - Rpc call (Batch call, optimize payload)
    - Read from cache
2. Update offchain data cache
    - Cache management (hot/cold cache)
    - Could be async write or put it after the transaction is sent
3. Evaluate profitability condition
    - Collateral ratio
    - Price (arbitrage case)

### Profit evaluation

1. Gas cost estimation
    - Pre-computed gas units
    - Latest gas price
    - Some buffer for priority fee
2. Net profit evaluation

### Transaction submission

1. Mempool monitoring
    - Front-run, outbid
2. Gas fee fine-tune
3. Transaction propagator
    - Send to transaction propagator service or specific node

## Pseudocode

```
while(true) {
    // state monitoring
    positions = readFromHotCache();
    updatedPositions = queryStateByPositions(positions);
    potentialPositions = [];
    for (position in updatedPositions) {
        profitBeforeGasFromPosition = estimateProfitBeforeGas(position);
        if (profitBeforeGasFromPosition > 0) {
            position.profitBeforeGasFromPosition = profitBeforeGasFromPosition;
            potentialPositions.append(position);
        }
    }

    // net profit evaluation
    gasPrice = getLatestGasPrice();
    profitablePositions = [];
    for (position in potentialPositions) {
        gasUnits = getPreComputedGasUnits(position);
        netProfit = position.profitBeforeGasFromPosition - gasUnits * gasPrice;
        if (netProfit > 0) {
            position.netProfit = netProfit;
            profitablePositions.append(position);
        }
    }

    // transaction submission
    for (position in profitablePositions) {
        mempoolTx = getMempoolTxFromLogs(position);
        liquidateTx = prepareAndOutBidLiquidateTx(position, mempoolTx);
        sendTx(liquidateTx);
    }

    updateHotCache(updatedPositions);
}

setInterval(
    updateColdCache,
    30s
);

mempoolSocket.on(tx) {
    if (isTargetTx(tx)) {
        writeToMempoolLogs(tx);
    }
}
```

## General Configuration

-   Network RPC URL (all evm chains)
-   Wallet private key
-   Telegram bot private key
