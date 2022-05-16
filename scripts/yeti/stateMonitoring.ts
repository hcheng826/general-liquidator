import { Position } from "./types";
import { troveManagerContract } from "./init";

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

export function updateHotCache() {}

// cold cache includes more positions. it's refreshed more infrequently
export async function updateColdCache() {
    // console.log('troveManagerContract:', troveManagerContract);
    const trovesCount = (await troveManagerContract.getTroveOwnersCount()).toNumber();
    // console.log('trovesCount', trovesCount);
    let troves: Array<Position> = new Array<Position>();
    // for (let i = 0; i < trovesCount; i++) {
    for (let i = 0; i < 10; i++) {
        const troveOwnerAddress = await troveManagerContract.TroveOwners(i);
        console.log('trove', i, troveOwnerAddress);
        const ICR = await troveManagerContract.getCurrentICR(troveOwnerAddress);
        const AICR = await troveManagerContract.getCurrentAICR(troveOwnerAddress);
        troves.push({
            borrowerAddress: troveOwnerAddress,
            ICR,
            AICR
        });
    }
    troves.sort((a, b) => {
        return a.ICR - b.ICR;
    })
    console.log(troves);
}
