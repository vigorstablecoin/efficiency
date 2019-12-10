const assert = require('assert');

const PROFILE_WASM_PATH = './compiled/profile.wasm';
const PROFILE_ABI_PATH = './compiled/profile.abi';

describe("Test profile contract", function (eoslime) {

    // Increase mocha(testing framework) time, otherwise tests fails
    this.timeout(15000);

    let profileContract;
    let profileUser1;
    let profileUser2;

    const userprofile1 = {
      nickname: 'John Doe',
      avatar: 'https://johnfdoe.com/avatars/JohnDoe.jpg',
      website: 'https://johnfdoe.com',
      locale: 'en_US',
      metadata: '{}'
    };
    const userprofile2 = {
      nickname: 'Jane Doe',
      avatar: 'https://johnfdoe.com/avatars/JaneDoe.jpg',
      website: 'https://johnfdoe.com/wife',
      locale: 'en_US',
      metadata: '{}'
    };

    before(async () => {
        const accounts = await eoslime.Account.createRandoms(2);
        profileUser1 = accounts[0];
        profileUser2 = accounts[1];

        /*
            CleanDeployer creates for you a new account behind the scene
            on which the contract code is deployed

            Note! CleanDeployer always deploy the contract code on a new fresh account

            You can access the contract account as -> tokenContract.executor
        */
        profileContract = await eoslime.Contract.deploy(PROFILE_WASM_PATH, PROFILE_ABI_PATH);
    });

    it("update John Doe profile", async () => {
        let tx = await profileContract.update(profileUser1.name, userprofile1.nickname, userprofile1.avatar, userprofile1.website,
                                              userprofile1.locale, userprofile1.metadata, {from: profileUser1});

        console.log('CPU:', tx.processed.receipt.cpu_usage_us, 'NET:', tx.processed.net_usage);

        let profileData = await profileContract.profiles.equal(profileUser1.name).find();

        assert.equal(profileData[0].user,     profileUser1.name,      "Incorrect user");
        assert.equal(profileData[0].nickname, userprofile1.nickname,  "Incorrect nickname");
        assert.equal(profileData[0].avatar,   userprofile1.avatar,    "Incorrect avatar");
        assert.equal(profileData[0].website,  userprofile1.website,   "Incorrect website");
        assert.equal(profileData[0].locale,   userprofile1.locale,    "Incorrect locale");
        assert.equal(profileData[0].metadata, userprofile1.metadata,  "Incorrect metadata");
    });

    it("update Jane Doe profile", async () => {
        let tx = await profileContract.update(profileUser2.name, userprofile2.nickname, userprofile2.avatar, userprofile2.website,
                                              userprofile2.locale, userprofile2.metadata, {from: profileUser2});

        console.log('CPU:', tx.processed.receipt.cpu_usage_us, 'NET:', tx.processed.net_usage);

        let profileData = await profileContract.profiles.equal(profileUser2.name).find();

        assert.equal(profileData[0].user,     profileUser2.name,      "Incorrect user");
        assert.equal(profileData[0].nickname, userprofile2.nickname,  "Incorrect nickname");
        assert.equal(profileData[0].avatar,   userprofile2.avatar,    "Incorrect avatar");
        assert.equal(profileData[0].website,  userprofile2.website,   "Incorrect website");
        assert.equal(profileData[0].locale,   userprofile2.locale,    "Incorrect locale");
        assert.equal(profileData[0].metadata, userprofile2.metadata,  "Incorrect metadata");
      });

    it("John Doe count one thousand", async () => {
        let tx = await profileContract.countot(profileUser1.name, {from: profileUser1});

        console.log('CPU:', tx.processed.receipt.cpu_usage_us, 'NET:', tx.processed.net_usage);

        let profileData = await profileContract.profiles.equal(profileUser1.name).find();

        assert.equal(profileData[0].count, '1000.00000000000000000', "Not one thousand");
    });

    it("Jane Doe count one thousand", async () => {
        let tx = await profileContract.countot(profileUser2.name, {from: profileUser2});

        console.log('CPU:', tx.processed.receipt.cpu_usage_us, 'NET:', tx.processed.net_usage);

        let profileData = await profileContract.profiles.equal(profileUser2.name).find();

        assert.equal(profileData[0].count, '1000.00000000000000000', "Not one thousand");
    });

});
