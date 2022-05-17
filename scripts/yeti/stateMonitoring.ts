import { Position } from "./types";
import { troveManagerContract, hotTrovesWindowSize } from "./config";
import { ethers } from "ethers";
import fs from 'fs';

// hot cache is the positions that we want to closely look at (at the edge of being liquidated)
export function readFromHotCache(): Array<Position> {
    const troves = fs.readFileSync('./scripts/yeti/cache/hotTroves.json');
    return JSON.parse(troves.toString());
}

export function estimateProfitBeforeGas(position: Position): number {
    return 0;
}

export async function updateHotCache(positions: Array<Position>) {
    const trovesPromises = positions.map((position) => {
        return troveManagerContract.getCurrentICR(position.borrowerAddress).then((ICR: ethers.BigNumber) => {
            return troveManagerContract.getCurrentAICR(position.borrowerAddress).then((AICR: ethers.BigNumber) => {
                return {
                    borrowerAddress: position.borrowerAddress,
                    ICR,
                    AICR
                };
            });
        });
    });

    const troves = await Promise.all(trovesPromises);
    troves.sort((a, b) => {
        return a.ICR.gt(b.ICR) ? 1 : -1;
    });

    fs.writeFileSync('./scripts/yeti/cache/hotTroves.json', JSON.stringify(troves.slice(0, hotTrovesWindowSize).map(trove => {
        return {
            borrowerAddress: trove.borrowerAddress,
            // @ts-ignore
            ICR: trove.ICR.toString()/1e18,
            // @ts-ignore
            AICR: trove.AICR.toString()/1e18,
        }
    })));
}

// cold cache includes more positions. it's refreshed more infrequently
export async function updateColdAndHotCache() {
    const trovesCount = (await troveManagerContract.getTroveOwnersCount()).toNumber();
    let trovesPromises: Array<Promise<Position>> = new Array<Promise<Position>>();

    for (let i = 0; i < trovesCount; i++) {
        const trovePromise = troveManagerContract.TroveOwners(i).then((troveOwnerAddress: string) => {
            return troveManagerContract.getCurrentICR(troveOwnerAddress).then((ICR: ethers.BigNumber) => {
                return troveManagerContract.getCurrentAICR(troveOwnerAddress).then((AICR: ethers.BigNumber) => {
                    return {
                        borrowerAddress: troveOwnerAddress,
                        ICR,
                        AICR
                    };
                });
            });
        });
        trovesPromises.push(trovePromise);
    }

    const troves = await Promise.all(trovesPromises);
    troves.sort((a, b) => {
        return a.ICR.gt(b.ICR) ? 1 : -1;
    });

    fs.writeFileSync('./scripts/yeti/cache/allTroves.json', JSON.stringify(troves.map(trove => {
        return {
            borrowerAddress: trove.borrowerAddress,
            // @ts-ignore
            ICR: trove.ICR.toString()/1e18,
            // @ts-ignore
            AICR: trove.AICR.toString()/1e18,
        }
    })));

    fs.writeFileSync('./scripts/yeti/cache/hotTroves.json', JSON.stringify(troves.slice(0, hotTrovesWindowSize).map(trove => {
        return {
            borrowerAddress: trove.borrowerAddress,
            // @ts-ignore
            ICR: trove.ICR.toString()/1e18,
            // @ts-ignore
            AICR: trove.AICR.toString()/1e18,
        }
    })));
}
