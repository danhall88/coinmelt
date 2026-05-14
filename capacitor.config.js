module.exports = {
  appId: 'app.coinmelt.www',
  appName: 'CoinMelt',
  webDir: 'out',
  server: {
    url: 'https://coinmelt.app',
    cleartext: false,
    allowNavigation: [
      'coinmelt.app',
      '*.coinmelt.app',
      '*.googlesyndication.com',
      '*.doubleclick.net',
      '*.google.com',
      '*.googleapis.com'
    ]
  },
  ios: {
    allowsLinkPreview: false,
    scrollEnabled: true,
    contentInset: 'always'
  }
}