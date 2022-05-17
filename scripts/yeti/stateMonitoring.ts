import { Position } from "./types";
import { troveManagerContract } from "./init";
import { ethers } from "ethers";
import fs from 'fs';

// hot cache is the positions that we want to closely look at (at the edge of being liquidated)
export function readFromHotCache(): Array<Position> {
    return [];
}
export function queryStateByPositions(positions: Array<Position>): Array<Position> {
    return [];
}
export function estimateProfitBeforeGas(position: Position): number {
    return 0;
}

export async function updateHotCache() {}

// cold cache includes more positions. it's refreshed more infrequently
export async function updateColdCache() {
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
    return troves
}
