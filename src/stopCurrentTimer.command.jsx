import * as Productive from './support/Productive.service.js';

import {
  LocalStorage,
  Toast,
  showHUD,
  showToast,
} from '@raycast/api';

// --------------------------------------------

export default async function stopCurrentTimerCommand() {
  const recentTimeEntryId = await LocalStorage.getItem('productiveRecentTimeEntryId');

  if (typeof(recentTimeEntryId) === 'undefined') {
    await showHUD('⏲️ No current timer.');
    return;
  }

  const toast = await showToast({
    title: '⏲️ Stop Current Timer',
    message: 'Stopping current timer...',
    style: Toast.Style.Animated,
  });

  await Productive.stopTimer({ timeEntryId: recentTimeEntryId });
  LocalStorage.removeItem('productiveRecentTimeEntryId');
  await showHUD('⏲️ Timer stopped.');
}
