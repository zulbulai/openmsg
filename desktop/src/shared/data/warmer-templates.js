/**
 * Curated Warming Templates Library (Phase 7D.2)
 * Realistic multi-turn conversation dialogues with nested Spintax support
 * Categories: Casual Chatter, Greetings, Follow-ups, Emoji & Quick Reactions
 */

const { parseSpintax } = require('../utils/spintax');

const CURATED_WARMING_DIALOGUES = [
  // ─── 1. GREETINGS & CHECK-INS ───────────────────────────────────────────
  {
    id: 'greet_morning_1',
    category: 'greetings',
    title: 'Morning Motivation',
    starter: '{Good morning|Morning|Hey, good morning}! {Hope you have a great day ahead|Wishing you a productive day|Have an awesome day}!',
    reply: '{Good morning|Morning}! {Thank you, hope your day is great as well|Thanks! Same to you|Appreciate it, let us have a productive one} 😊',
    followup: '{Thanks|Appreciate it}! {Talk soon|Catch up later|Have a good one} 👍'
  },
  {
    id: 'greet_checkin_2',
    category: 'greetings',
    title: 'General Check-in',
    starter: '{Hey|Hello|Hi there}! {How have you been lately|How is everything going with you|How are things on your end}?',
    reply: '{Hey!|Hello!|All good here!} {Things are going well, thanks for asking|Pretty busy as usual, but all good|Going well! What about you}?',
    followup: '{Same here|Glad to hear that|Good to know}! {Catch you later|Will catch up soon|Stay in touch} 🙌'
  },
  {
    id: 'greet_friday_3',
    category: 'greetings',
    title: 'Happy Friday & Weekend',
    starter: '{Happy Friday|TGIF|Happy weekend eve}! {Any fun plans for the weekend|Got anything exciting planned|Ready for the weekend}?',
    reply: '{Happy Friday|Hey, happy Friday}! {Mostly just relaxing and catching up on sleep|A bit of travel and downtime|Nothing much, just taking it easy}. {What about you|You}?',
    followup: '{Sounds nice|Same here, needed a break|Enjoy your weekend}! {Have fun|Take care|Relax well} 🎉'
  },
  {
    id: 'greet_evening_4',
    category: 'greetings',
    title: 'Evening Catchup',
    starter: '{Good evening|Evening|Hey there}! {How did the day treat you|How was your day today|Hope your day went well}?',
    reply: '{Hey!|Evening!|Good evening!} {It was quite busy, but wrapped up nicely|Not too bad, glad the day is done|Pretty smooth overall}. {How about yours|How was yours}?',
    followup: '{Glad to hear|Mine was alright too|Wrapped up here as well}. {Rest up|Have a relaxing evening|Good night in advance} 🌙'
  },

  // ─── 2. CASUAL CHATTER ──────────────────────────────────────────────────
  {
    id: 'casual_weather_1',
    category: 'casual',
    title: 'Weather & Climate',
    starter: '{Is it just me or is the weather|The weather today is} {really pleasant|so warm|quite nice} {outside today|lately}?',
    reply: '{Totally agree|Yeah actually|Yes, noticed that too}! {It feels much better today|Hopefully it stays like this|Nice break from before}.',
    followup: '{Definitely|100%|For sure}! {Enjoy the nice weather|Step outside if you get a chance} 🌤️'
  },
  {
    id: 'casual_coffee_2',
    category: 'casual',
    title: 'Coffee / Tea Break',
    starter: '{Did you get your coffee yet today|Need a strong cup of coffee today|Time for a quick tea break} ☕',
    reply: '{Haha on my second cup already|Just brewed one right now|Desperately needed one too}! {Saves the day|Keeps things running}.',
    followup: '{Haha exactly|Nothing beats it|Enjoy the brew} 😄'
  },
  {
    id: 'casual_work_banter_3',
    category: 'casual',
    title: 'Workload & Schedule',
    starter: '{How is your workload looking this week|Is this week super packed for you too|Managing to keep up with the schedule}?',
    reply: '{A bit hectic|Quite packed honestly|A lot on the plate}, {but getting through the list one by one|almost done with the main tasks|surviving haha}.',
    followup: '{Hang in there|You got this|Take quick breaks when needed}! 💪'
  },
  {
    id: 'casual_lunch_4',
    category: 'casual',
    title: 'Lunch Ideas',
    starter: '{Have you had lunch yet|Taking a lunch break yet|What is on the lunch menu today}?',
    reply: '{Just finished having lunch|About to grab something quick|Taking a 20 min break now}. {You should grab something too|Had yours yet}?',
    followup: '{Heading to grab a bite now|Yeah all done here too}! {Enjoy the rest of the afternoon|Talk later} 🍽️'
  },
  {
    id: 'casual_read_5',
    category: 'casual',
    title: 'Interesting Article / Read',
    starter: '{Did you happen to see that new article on tech trends|Came across an interesting post earlier today}? {Pretty neat perspective|Lots of good points}.',
    reply: '{Oh really|Not yet, send the title|Saw something similar}! {Will definitely check it out when free|Sounds interesting}.',
    followup: '{Cool, will share the link shortly|No rush, enjoy the read when you get time} 📖'
  },

  // ─── 3. FOLLOW-UPS & CHECK-INS ──────────────────────────────────────────
  {
    id: 'followup_doc_1',
    category: 'followups',
    title: 'Document & Review Confirmation',
    starter: '{Hey, did you get a chance to glance at the file|Just checking if you received the notes|Quick check on the document}?',
    reply: '{Yes received it|Got it in my inbox|Saw it earlier}, {will review it shortly|taking a look in an hour|looks good at first glance}.',
    followup: '{Perfect, sounds great|Thanks, no rush at all|Appreciate the quick update} 👍'
  },
  {
    id: 'followup_call_2',
    category: 'followups',
    title: 'Call Availability',
    starter: '{Are you free for a quick 2-minute sync later|Would you be available for a short ping later today}?',
    reply: '{Sure, maybe around 4 PM|Yes, after 3 PM works best for me|Ping me anytime in the afternoon}.',
    followup: '{Awesome, will ping you then|Noted, see you at 4|Sounds like a plan} 🤝'
  },
  {
    id: 'followup_status_3',
    category: 'followups',
    title: 'Project Status Ping',
    starter: '{Let me know once you hear back regarding the update|Any updates on that front yet}?',
    reply: '{Still waiting on a reply|Will update you the moment I hear back|Expecting word by evening}.',
    followup: '{Understood|Thanks for the heads up|Keep me posted} 🙏'
  },
  {
    id: 'followup_reminder_4',
    category: 'followups',
    title: 'Gentle Reminder',
    starter: '{Just a gentle ping so this does not get buried|Friendly reminder about our discussion from yesterday}.',
    reply: '{Thanks for the reminder|Good you pinged, almost slipped my mind|On it right now}! {Getting it done|Will update you soon}.',
    followup: '{No problem at all|Great, thanks|Much appreciated} ⭐'
  },

  // ─── 4. EMOJI & QUICK REACTIONS ─────────────────────────────────────────
  {
    id: 'emoji_thanks_1',
    category: 'emoji',
    title: 'Appreciation & Thanks',
    starter: '{Thanks a lot for the help earlier|Really appreciate your support on this|Thank you so much} 🙏',
    reply: '{Anytime! Happy to help|You are most welcome|No worries at all, happy to help} 😊',
    followup: '{Have an awesome day|Catch you later} ✨'
  },
  {
    id: 'emoji_laugh_2',
    category: 'emoji',
    title: 'Humor & Laugh',
    starter: '{Haha you will not believe what just happened|That was hilarious earlier} 😂',
    reply: '{Haha really? What happened|Right?! I could not stop laughing|Hilarious for sure} 🤣',
    followup: '{Will tell you the full story later haha|Made my day} 👌'
  },
  {
    id: 'emoji_thumbs_3',
    category: 'emoji',
    title: 'Quick Agreement',
    starter: '{Sounds like a solid plan to me|I agree with that approach} 👍',
    reply: '{Glad we are on the same page|Perfect, let us go with that|Great minds think alike} 🤝',
    followup: '{Let us do it|Talk soon} 🚀'
  }
];

/**
 * Get all curated dialogues
 */
function getAllCuratedDialogues() {
  return CURATED_WARMING_DIALOGUES;
}

/**
 * Get dialogues filtered by enabled categories
 * @param {string[]} categories - e.g. ['casual', 'greetings']
 */
function getDialoguesByCategories(categories = []) {
  if (!categories || categories.length === 0) {
    return CURATED_WARMING_DIALOGUES;
  }
  const set = new Set(categories.map(c => c.toLowerCase()));
  const filtered = CURATED_WARMING_DIALOGUES.filter(d => set.has(d.category.toLowerCase()));
  return filtered.length > 0 ? filtered : CURATED_WARMING_DIALOGUES;
}

/**
 * Generate a parsed, randomized dialogue instance
 * @param {Object} options
 * @param {string[]} [options.categories] - Array of enabled categories
 * @param {Array} [options.customTemplates] - User-defined templates
 * @returns {{ id: string, title: string, category: string, starter: string, reply: string, followup?: string }}
 */
function generateWarmingDialogue(options = {}) {
  const { categories = [], customTemplates = [] } = options;
  const standardPool = getDialoguesByCategories(categories);

  // If user provided custom templates matching categories, include them
  let combinedPool = [...standardPool];
  if (Array.isArray(customTemplates) && customTemplates.length > 0) {
    combinedPool = combinedPool.concat(customTemplates);
  }

  const selected = combinedPool[Math.floor(Math.random() * combinedPool.length)];

  return {
    id: selected.id || 'custom_' + Date.now(),
    title: selected.title || 'Warming Dialogue',
    category: selected.category || 'casual',
    starter: parseSpintax(selected.starter || selected.text || 'Hello!'),
    reply: parseSpintax(selected.reply || 'Hey there, good to hear from you!'),
    followup: selected.followup ? parseSpintax(selected.followup) : null
  };
}

module.exports = {
  CURATED_WARMING_DIALOGUES,
  getAllCuratedDialogues,
  getDialoguesByCategories,
  generateWarmingDialogue
};
