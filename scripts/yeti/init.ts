import { ethers } from "hardhat";
import { Contract } from "ethers";

import troveManagerAbi from './TroveManager.abi.json';
const troveManagerAddress = '0x000000000000614c27530d24B5f039EC15A61d8d' // proxy
export let troveManagerContract: Contract;

export async function init() {
    // const [signer] = await ethers.getSigners();
    troveManagerContract = await ethers.getContractAt(troveManagerAbi, troveManagerAddress);
}
