import { Position } from "./types";

export function readFromHotCache(): Array<Position> {
    return [];
}
export function queryStateByPositions(positions: Array<Position>): Array<Position> {
    return [];
}
export function estimateProfitBeforeGas(position: Position): number {
    return 0;
}

export function updateHotCache(positions: Array<Position>) {}

export function updateColdCache() {}
