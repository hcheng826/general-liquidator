import { ethers } from "ethers";

export type Position = {
    // will definitely add more info such as borrower address, token address, etc.
    borrowerAddress: string,
    ICR: ethers.BigNumber,
    AICR: ethers.BigNumber,
    profitBeforeGasFromPosition?: number,
    netProfit?: number,
}
