export type Position = {
    // will definitely add more info such as borrower address, token address, etc.
    borrowerAddress: string,
    ICR: number,
    AICR: number,
    profitBeforeGasFromPosition?: number,
    netProfit?: number,
}
