'use strict'

const QvacForgePlugin = require('@qvac/sdk/electron-forge')

module.exports = {
  packagerConfig: {
    name: 'LocalStudy',
    asar: false
  },
  rebuildConfig: {},
  makers: [
    { name: '@electron-forge/maker-zip', platforms: ['win32', 'linux', 'darwin'] }
  ],
  plugins: [new QvacForgePlugin({ logLevel: 'info' })]
}
