import { Position, YetiStatus } from './types';
import { troveManagerContract, hotTrovesWindowSize, MCR, gasCompensation } from './config';
import { ethers } from 'ethers';
import fs from 'fs';

// hot cache is the positions that we want to closely look at (at the edge of being liquidated)
export function readFromHotCache(): Array<Position> {
    const trovesString = fs.readFileSync('./scripts/yeti/cache/hotTroves.json');
    const troves = JSON.parse(trovesString.toString()).map((trove: any) => {
        const ICR = ethers.BigNumber.from(trove.ICR);
        const AICR = ethers.BigNumber.from(trove.AICR);
        return {
            borrowerAddress: trove.borrowerAddress,
            ICR,
            AICR
        };
    });
    return troves;
}

// TODO: include the 0.5% collateral value
export function estimateProfitBeforeGas(position: Position, yetiStatus: YetiStatus): number {
    // liquidation condition: https://techdocs.yeti.finance/how-does-yeti-finance-work/recovery-mode#what-is-recovery-mode
    // in both normal mode and recovery mode, liquidation condition is ICR < MCR
    if (position.ICR.lt(MCR)) {
        return gasCompensation;
    }

    if (yetiStatus.isRecoveryMode) {
        // in recovery mode, liquidation condition is AICR < TCR
        if (position.AICR.lt(yetiStatus.TCR)) {
            return gasCompensation;
        }
    }
    return 0
}

export async function updateHotCache(positions: Array<Position>): Promise<Array<Position>> {
    const positionsPromises = positions.map((position) => {
        return troveManagerContract.isTroveActive(position.borrowerAddress).then((isActive: boolean) => {
            if (!isActive) { return null; }
            return troveManagerContract.getCurrentICR(position.borrowerAddress).then((ICR: ethers.BigNumber) => {
                return troveManagerContract.getCurrentAICR(position.borrowerAddress).then((AICR: ethers.BigNumber) => {
                    return {
                        borrowerAddress: position.borrowerAddress,
                        ICR,
                        AICR,
                    };
                });
            });
        });
    });

    const newPositions = (await Promise.all(positionsPromises)).filter(Boolean); // remove null
    newPositions.sort((a, b) => {
        return a.ICR.gt(b.ICR) ? 1 : -1;
    });

    return newPositions;
}

// cold cache includes more positions. it's refreshed more infrequently
export async function updateColdAndHotCache() {
    const trovesCount = (await troveManagerContract.getTroveOwnersCount()).toNumber();
    let trovesPromises: Array<Promise<Position>> = new Array<Promise<Position>>();

    for (let i = 0; i < trovesCount; i++) {
        const trovePromise = troveManagerContract.TroveOwners(i).then((troveOwnerAddress: string) => {
            return troveManagerContract.isTroveActive(troveOwnerAddress).then((isActive: boolean) => {
                if (!isActive) { return null; }
                return troveManagerContract.getCurrentICR(troveOwnerAddress).then((ICR: ethers.BigNumber) => {
                    return troveManagerContract.getCurrentAICR(troveOwnerAddress).then((AICR: ethers.BigNumber) => {
                        return {
                            borrowerAddress: troveOwnerAddress,
                            ICR,
                            AICR,
                        };
                    });
                });
            });
        });

        trovesPromises.push(trovePromise);
    }

    const troves = (await Promise.all(trovesPromises)).filter(Boolean); // remove null;
    troves.sort((a, b) => {
        return a.ICR.gt(b.ICR) ? 1 : -1;
    });

    fs.writeFileSync(
        './scripts/yeti/cache/allTroves.json',
        JSON.stringify(
            troves.map((trove) => {
                return {
                    borrowerAddress: trove.borrowerAddress,
                    ICR: trove.ICR.toString(),
                    AICR: trove.AICR.toString(),
                };
            })
        )
    );

    fs.writeFileSync(
        './scripts/yeti/cache/hotTroves.json',
        JSON.stringify(
            troves.slice(0, hotTrovesWindowSize).map((trove) => {
                return {
                    borrowerAddress: trove.borrowerAddress,
                    ICR: trove.ICR.toString(),
                    AICR: trove.AICR.toString(),
                };
            })
        )
    );
}

export async function getYetiStatus(): Promise<YetiStatus> {
    return {
        isRecoveryMode: await troveManagerContract.checkRecoveryMode(),
        TCR: await troveManagerContract.getTCR()
    };
}
