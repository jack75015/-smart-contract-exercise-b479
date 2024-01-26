
/* global ethers task */
require('@nomiclabs/hardhat-waffle')
require("hardhat-gas-reporter");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    ganache: {
      url: "http://localhost:8545", 
      chainId: 1337,
    },
  },
  solidity: '0.8.17',
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  mocha: {
    timeout: 100000000
  },
  gasReporter: {
    enabled: true
  }
}
