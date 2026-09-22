import * as _0x5180ff from '../ui/kit.js';
import { openCampaignWizard, campaignList } from './broadcasts.js';
import { isScheduled } from '../core/scheduler.js';
export default {
  id: 'schedules',
  title: 'Schedule',
  subtitle: 'Everything queued to send later, to one chat or to many.',
  icon: 'calendar-clock',
  render(_0x512980) {
    const { app: _0x2cc6ba, shell: _0x1fe56b } = _0x512980;
    const _0x478947 = (_0x5dc0b7) =>
      openCampaignWizard(_0x2cc6ba, _0x1fe56b, {
        kind: 'schedule',
        chatId: _0x512980.params.chatId,
        preset: _0x5dc0b7,
      });
    _0x512980.setActions([
      _0x5180ff.button('Add schedule', {
        icon: 'plus',
        variant: 'primary',
        onClick: () => _0x478947(),
      }),
    ]);
    if (_0x512980.params.create || _0x512980.params.chatId) {
      setTimeout(() => _0x478947(), 60);
    }
    return campaignList(_0x512980, 'schedule', 'No schedules yet', isScheduled);
  },
};
