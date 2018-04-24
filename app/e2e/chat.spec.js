const { blacklistLiveReloadUrl, reloadApp } = require('detox-expo-helpers');

const loadApp = async () => {
  await blacklistLiveReloadUrl();
  await reloadApp();
  await waitFor(element(by.id('welcome'))).toBeVisible().withTimeout(1000);
}

describe('Chat app', () => {
  beforeEach(async () => {
    await loadApp();
  });

  it('should have welcome screen', async () => {
    await expect(element(by.id('welcome'))).toBeVisible();
  });
});
