import { Position } from "./types";

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
export function updateColdCache() {}
