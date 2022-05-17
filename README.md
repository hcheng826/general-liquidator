# General-Liquidator

A general liquidate workflow that applies to all kinds of liquidation (or could expand to arbitrage, reinvest). User
just needs to implement each coponent and the workflow serves as a platform that execute each step.

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

-   Network RPC URL (all evm chain)
-   Wallet private key
-   Telegram bot private key

# Advanced Sample Hardhat Project

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the
ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an
example of a task implementation, which simply lists the available accounts. It also comes with a variety of other
tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by
Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your
Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the
deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable
`TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see
[the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).
