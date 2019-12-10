const PROFILE_WASM_PATH = './compiled/profile.wasm';
const PROFILE_ABI_PATH = './compiled/profile.abi';

let deploy = async function (eoslime, deployer) {

    if (!deployer) {
        deployer = await eoslime.Account.createRandom();
    }

    let profileContract = await eoslime.Contract.deployOnAccount(PROFILE_WASM_PATH, PROFILE_ABI_PATH, deployer);
}

module.exports = deploy;
