import { matchAny } from './matcher.js';
import { emptyActions } from './actions.js';
import { newMessage } from './messages.js';
export function newWorkflow() {
  return {
    name: '',
    enabled: true,
    target: 'individual',
    allGroups: true,
    groupIds: [],
    executeOn: 'keyword',
    keywords: [],
    matchTypes: ['contains'],
    caseSensitive: false,
    days: [],
    limitPerChat: 0,
    reply: {
      mode: 'messages',
      messages: [
        Object.assign(newMessage('none'), {
          text: '',
        }),
      ],
      quickReplyId: '',
    },
    options: {
      showTyping: true,
      dontSendIfChatOpen: false,
      markRead: false,
      replyPrivately: false,
      mentionAll: false,
      delayMin: 0,
      delayMax: 0,
    },
    post: emptyActions(),
  };
}
export function validateWorkflow(_0x42acb3) {
  const _0x316990 = [];
  if (!String(_0x42acb3.name || '').trim()) {
    _0x316990.push('Give the bot a name.');
  }
  if (_0x42acb3.executeOn === 'keyword' && !(_0x42acb3.keywords || []).length) {
    _0x316990.push('Add at least one keyword.');
  }
  if (
    _0x42acb3.target === 'group' &&
    !_0x42acb3.allGroups &&
    !(_0x42acb3.groupIds || []).length
  ) {
    _0x316990.push('Pick at least one group, or choose all groups.');
  }
  if (_0x42acb3.reply.mode === 'quick' && !_0x42acb3.reply.quickReplyId) {
    _0x316990.push('Pick a canned response to send.');
  }
  if (
    _0x42acb3.reply.mode === 'messages' &&
    !(_0x42acb3.reply.messages || []).length
  ) {
    _0x316990.push('Add at least one message.');
  }
  return _0x316990;
}
export function workflowMatches(_0x4747c7, _0x523fa7, _0x39c561 = {}) {
  if (_0x4747c7.enabled === false) {
    return false;
  }
  const _0x5c83bc = !!_0x523fa7.isGroup;
  if ((_0x4747c7.target === 'group') !== _0x5c83bc) {
    return false;
  }
  if (
    _0x5c83bc &&
    !_0x4747c7.allGroups &&
    !(_0x4747c7.groupIds || []).includes(_0x523fa7.chatId)
  ) {
    return false;
  }
  if (
    (_0x4747c7.days || []).length &&
    !_0x4747c7.days.includes(new Date(_0x39c561.now || Date.now()).getDay())
  ) {
    return false;
  }
  if (
    _0x4747c7.limitPerChat > 0 &&
    (_0x39c561.count || 0) >= _0x4747c7.limitPerChat
  ) {
    return false;
  }
  if (
    _0x4747c7.options &&
    _0x4747c7.options.dontSendIfChatOpen &&
    _0x39c561.activeChatId === _0x523fa7.chatId
  ) {
    return false;
  }
  if (_0x4747c7.executeOn === 'newChat') {
    return !!_0x39c561.isNewChat;
  }
  if (_0x4747c7.executeOn === 'every') {
    return true;
  }
  return (
    matchAny(
      _0x523fa7.body,
      _0x4747c7.keywords,
      _0x4747c7.matchTypes,
      _0x4747c7.caseSensitive,
    ) !== null
  );
}
export function replyMessages(_0x3a9006, _0x4041fb) {
  if (_0x3a9006.reply.mode === 'quick') {
    const _0xdd679c = _0x4041fb.get(
      'quickReplies',
      _0x3a9006.reply.quickReplyId,
    );
    if (_0xdd679c) {
      return _0xdd679c.messages;
    } else {
      return [];
    }
  }
  return _0x3a9006.reply.messages || [];
}
