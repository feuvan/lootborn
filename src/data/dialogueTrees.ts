import type { DialogueTree } from './types';

/**
 * Branching dialogue trees for quest NPCs — one per zone.
 * All text in Simplified Chinese.
 */

/** Zone 1: 翡翠平原 — 村长 (quest_elder) */
export const elderDialogueTree: DialogueTree = {
  startNodeId: 'root',
  nodes: {
    root: {
      id: 'root',
      text: '勇士，你来了！翡翠平原正面临严重的威胁。最近村庄周围出现了大量怪物，村民们不敢出门。',
      choices: [
        { text: '告诉我发生了什么', nextNodeId: 'explain' },
        { text: '我能帮什么忙？', nextNodeId: 'help' },
        { text: '这里有什么奖励吗？', nextNodeId: 'reward_ask' },
      ],
    },
    explain: {
      id: 'explain',
      text: '三天前，一群哥布林从南方的山洞里涌出来。它们不仅袭击了几处农田，还抢走了村民的物资。更糟糕的是，史莱姆也开始在北部湿地繁殖失控。',
      choices: [
        { text: '我先去清理史莱姆', nextNodeId: 'accept_slimes', questTrigger: 'q_kill_slimes' },
        { text: '哥布林更危险，先对付它们', nextNodeId: 'goblin_first', prereqQuests: ['q_kill_slimes'] },
        { text: '两边我都处理', nextNodeId: 'both' },
      ],
    },
    help: {
      id: 'help',
      text: '太好了！你愿意帮忙真是太棒了。当前最紧急的是清除平原上泛滥的史莱姆，它们正在侵蚀我们的农田。',
      choices: [
        { text: '交给我了！', nextNodeId: 'accept_slimes', questTrigger: 'q_kill_slimes' },
        { text: '还有其他任务吗？', nextNodeId: 'other_quests' },
      ],
    },
    reward_ask: {
      id: 'reward_ask',
      text: '村庄虽然不富裕，但我们会尽力回报帮助我们的人。完成任务后你会获得金币和经验奖励，表现出色的话还有特殊物品。这些是提前给你的补给。',
      choices: [
        { text: '好的，我来帮忙（获得补给）', nextNodeId: 'help', reward: { gold: 30, exp: 50 } },
        { text: '我再想想', nextNodeId: 'farewell' },
      ],
    },
    accept_slimes: {
      id: 'accept_slimes',
      text: '感谢你！平原北部的湿地区域史莱姆最多，小心它们的腐蚀攻击。消灭10只后回来找我。',
      isEnd: true,
    },
    goblin_first: {
      id: 'goblin_first',
      text: '你说得对，哥布林确实更加危险。它们的营地在平原南部，消灭15只哥布林应该能挫败它们的锐气。',
      choices: [
        { text: '立刻出发！', nextNodeId: 'accept_goblins', questTrigger: 'q_kill_goblins' },
        { text: '我需要更多信息', nextNodeId: 'goblin_info' },
      ],
    },
    accept_goblins: {
      id: 'accept_goblins',
      text: '注意安全，勇士。哥布林虽然单个不强，但它们喜欢群体作战。',
      isEnd: true,
    },
    goblin_info: {
      id: 'goblin_info',
      text: '哥布林有三种——普通的巡逻兵、弓箭手和首领。首领比较狡猾，会躲在后排指挥。建议你先消灭弓箭手，再处理近战的。',
      choices: [
        { text: '明白了，我去清剿', nextNodeId: 'accept_goblins', questTrigger: 'q_kill_goblins' },
        { text: '我先去做其他准备', nextNodeId: 'farewell' },
      ],
    },
    both: {
      id: 'both',
      text: '真是勇敢！先从史莱姆开始吧，它们虽然弱但数量多。清理完后再去对付哥布林。',
      choices: [
        { text: '好的，先去清理史莱姆', nextNodeId: 'accept_slimes', questTrigger: 'q_kill_slimes' },
      ],
    },
    other_quests: {
      id: 'other_quests',
      text: '除了史莱姆，商人还需要一些史莱姆凝胶来调制药水。你也可以顺便帮忙采集一些平原上的草药。',
      choices: [
        { text: '我去收集史莱姆凝胶', nextNodeId: 'accept_gel', questTrigger: 'q_collect_slime_gel' },
        { text: '我去采集草药', nextNodeId: 'accept_herbs', questTrigger: 'q_herb_gathering' },
        { text: '先处理史莱姆问题', nextNodeId: 'accept_slimes', questTrigger: 'q_kill_slimes' },
      ],
    },
    accept_gel: {
      id: 'accept_gel',
      text: '好的！击杀史莱姆后它们会掉落凝胶，收集8份就够了。记得也可以顺便清理一下周围的史莱姆。',
      isEnd: true,
    },
    accept_herbs: {
      id: 'accept_herbs',
      text: '草药主要生长在平原西部的草地上。采集5份后送到药师那里就好。',
      isEnd: true,
    },
    farewell: {
      id: 'farewell',
      text: '好的，勇士。如果改变主意了，随时来找我。',
      isEnd: true,
    },
  },
};

/** Zone 2: 暮色森林 — 侦察兵 (quest_scout) */
export const scoutDialogueTree: DialogueTree = {
  startNodeId: 'root',
  nodes: {
    root: {
      id: 'root',
      text: '嘘...你来了正好。暮色森林里发生了怪事。亡灵开始在夜晚游荡，连老猎人都不敢深入了。',
      choices: [
        { text: '亡灵？发生了什么？', nextNodeId: 'undead_explain' },
        { text: '我需要先探索森林', nextNodeId: 'explore_first' },
        { text: '有什么线索吗？', nextNodeId: 'clues' },
      ],
    },
    undead_explain: {
      id: 'undead_explain',
      text: '大约一周前，废弃墓地附近开始出现骷髅和腐尸。一开始只有几只，现在整个北部都沦陷了。有人说是黑暗魔法的作用。',
      choices: [
        { text: '我去调查墓地', nextNodeId: 'investigate_graveyard' },
        { text: '先清理附近的亡灵', nextNodeId: 'clear_undead', questTrigger: 'q_kill_undead', prereqQuests: ['q_explore_forest'] },
        { text: '告诉我更多关于黑暗魔法的事', nextNodeId: 'dark_magic' },
      ],
    },
    explore_first: {
      id: 'explore_first',
      text: '谨慎是好事。森林分为几个区域——北部密林、废弃墓地和古老遗迹。每个地方都可能有线索。拿着这个，在森林里也许用得上。',
      choices: [
        { text: '谢谢补给，我去侦察各个区域', nextNodeId: 'accept_explore', questTrigger: 'q_explore_forest', reward: { gold: 50, exp: 80 } },
        { text: '哪个区域最危险？', nextNodeId: 'dangerous_area' },
      ],
    },
    clues: {
      id: 'clues',
      text: '我手下的一个斥候在南部失踪了。另外，森林深处有位隐士，据说他对这片森林了如指掌。也许他知道些什么。',
      choices: [
        { text: '我去找那个失踪的斥候', nextNodeId: 'accept_scout', questTrigger: 'q_lost_scout', prereqQuests: ['q_explore_forest'] },
        { text: '隐士在哪里？', nextNodeId: 'hermit_location', prereqQuests: ['q_kill_undead'] },
        { text: '我先去探索森林再说', nextNodeId: 'accept_explore', questTrigger: 'q_explore_forest' },
      ],
    },
    investigate_graveyard: {
      id: 'investigate_graveyard',
      text: '墓地在森林西部。但我建议你先熟悉整个森林的地形，免得迷路。这里的浓雾可不是闹着玩的。',
      choices: [
        { text: '好，我先全面侦察', nextNodeId: 'accept_explore', questTrigger: 'q_explore_forest' },
        { text: '我有经验，直接去墓地', nextNodeId: 'accept_explore', questTrigger: 'q_explore_forest' },
      ],
    },
    clear_undead: {
      id: 'clear_undead',
      text: '好主意！先清除森林中游荡的亡灵。骷髅战士和腐尸是最常见的，消灭它们可以暂时遏制蔓延。',
      isEnd: true,
    },
    dark_magic: {
      id: 'dark_magic',
      text: '村里的老人说，这片森林地下封印着一股古老的黑暗力量。如果封印被破坏了...后果不堪设想。森林深处的隐士也许知道更多。',
      choices: [
        { text: '我要去找隐士', nextNodeId: 'hermit_location', prereqQuests: ['q_kill_undead'] },
        { text: '先清理附近的威胁再说', nextNodeId: 'accept_explore', questTrigger: 'q_explore_forest' },
      ],
    },
    accept_explore: {
      id: 'accept_explore',
      text: '小心行事。森林里的狼人在夜晚特别活跃，还有成群的骷髅巡逻。记得标记你发现的异常区域。',
      isEnd: true,
    },
    dangerous_area: {
      id: 'dangerous_area',
      text: '废弃墓地最危险，亡灵密度最高。古老遗迹也很危险，那里有更强的怪物守卫。北部密林相对安全，但有狼群出没。',
      choices: [
        { text: '我从安全的地方开始', nextNodeId: 'accept_explore', questTrigger: 'q_explore_forest' },
        { text: '我直接去最危险的地方', nextNodeId: 'accept_explore', questTrigger: 'q_explore_forest' },
      ],
    },
    accept_scout: {
      id: 'accept_scout',
      text: '他上次汇报时在森林南部的一个废弃营地。如果他还活着，可能被亡灵包围了。请尽快赶去！',
      isEnd: true,
    },
    hermit_location: {
      id: 'hermit_location',
      text: '隐士住在森林东南角的一个小木屋里。他脾气古怪，但学识渊博。他应该知道亡灵复苏的真正原因。',
      choices: [
        { text: '我这就去找他', nextNodeId: 'accept_hermit', questTrigger: 'q_talk_hermit' },
        { text: '我先处理手头的任务', nextNodeId: 'farewell' },
      ],
    },
    accept_hermit: {
      id: 'accept_hermit',
      text: '好运，勇士。隐士的小屋不好找，注意看东南方向的古老石柱标记。',
      isEnd: true,
    },
    farewell: {
      id: 'farewell',
      text: '随时回来找我，我会在这里等你的消息。',
      isEnd: true,
    },
  },
};

/** Zone 3: 铁砧山脉 — 矮人长老 (quest_dwarf) */
export const dwarfDialogueTree: DialogueTree = {
  startNodeId: 'root',
  nodes: {
    root: {
      id: 'root',
      text: '欢迎来到铁砧山脉。这曾是我族辉煌的家园...直到石像鬼和巨魔占据了我们的遗迹。',
      choices: [
        { text: '你们为什么离开了？', nextNodeId: 'history' },
        { text: '我来帮你们夺回遗迹', nextNodeId: 'reclaim' },
        { text: '山脉里有什么宝藏？', nextNodeId: 'treasure' },
      ],
    },
    history: {
      id: 'history',
      text: '百年前一场大地震唤醒了沉睡的石像鬼群。它们攻击了我们的矿洞和锻造厅，我族被迫撤退到山脚下的营地。现在只剩下几个老矮人还记得那段历史。',
      choices: [
        { text: '是时候夺回家园了', nextNodeId: 'reclaim' },
        { text: '石像鬼有什么弱点？', nextNodeId: 'weakness' },
        { text: '我听说山里还有龙蛋？', nextNodeId: 'dragon_egg', prereqQuests: ['q_kill_gargoyles'] },
      ],
    },
    reclaim: {
      id: 'reclaim',
      text: '真的吗？太好了！首先你需要了解遗迹的布局。矿洞入口、锻造大厅和矮人王座是三个关键区域。',
      choices: [
        { text: '我去探索这三个区域', nextNodeId: 'accept_explore', questTrigger: 'q_explore_dwarf_ruins' },
        { text: '先告诉我更多情报', nextNodeId: 'intel' },
      ],
    },
    treasure: {
      id: 'treasure',
      text: '我族的宝藏不是金银珠宝，而是秘银——一种比钢铁更坚韧、更轻巧的金属。如果你能帮我找回秘银矿脉，我可以为你锻造一件武器。先收下这些金币作为诚意。',
      choices: [
        { text: '听起来不错，我帮你（获得金币）', nextNodeId: 'reclaim', reward: { gold: 100, exp: 120 } },
        { text: '还有什么值钱的东西？', nextNodeId: 'more_treasure' },
      ],
    },
    weakness: {
      id: 'weakness',
      text: '石像鬼白天会变得迟钝，它们在黑暗中更加凶猛。另外，它们的石皮对物理攻击有一定抵抗力，但魔法攻击效果更好。',
      choices: [
        { text: '了解了，我去对付它们', nextNodeId: 'accept_gargoyles', questTrigger: 'q_kill_gargoyles', prereqQuests: ['q_explore_dwarf_ruins'] },
        { text: '我先去了解遗迹布局', nextNodeId: 'accept_explore', questTrigger: 'q_explore_dwarf_ruins' },
      ],
    },
    intel: {
      id: 'intel',
      text: '矿洞入口在山脉北部，那里的石像鬼数量最少。锻造大厅在中央区域，有大量石巨人守卫。矮人王座在南部最深处，那里有最强的守卫。',
      choices: [
        { text: '从矿洞入口开始', nextNodeId: 'accept_explore', questTrigger: 'q_explore_dwarf_ruins' },
        { text: '直奔锻造大厅', nextNodeId: 'accept_explore', questTrigger: 'q_explore_dwarf_ruins' },
      ],
    },
    accept_explore: {
      id: 'accept_explore',
      text: '祝你好运。山脉中的通道错综复杂，注意标记你走过的路。如果遇到麻烦就回来找我。',
      isEnd: true,
    },
    accept_gargoyles: {
      id: 'accept_gargoyles',
      text: '消灭15只石像鬼应该能大大削弱它们的势力。它们主要盘踞在遗迹的高处和通道交叉口。',
      isEnd: true,
    },
    dragon_egg: {
      id: 'dragon_egg',
      text: '啊，你也听说了？在山脉最深处确实有一个古老的龙巢。传说那里还残留着龙的遗物——龙鳞碎片。如果你有胆量去探索...我可以给你指路。',
      choices: [
        { text: '我去探索龙巢', nextNodeId: 'accept_dragon', questTrigger: 'q_dragon_egg' },
        { text: '听起来太危险了', nextNodeId: 'farewell' },
      ],
    },
    accept_dragon: {
      id: 'accept_dragon',
      text: '龙巢在山脉西南方向的深渊旁。那里的怪物异常强大，做好充分准备再去。龙鳞碎片是极好的锻造材料。',
      isEnd: true,
    },
    more_treasure: {
      id: 'more_treasure',
      text: '锻造大厅里有我族先祖留下的符文石板和水晶矿脉。水晶可以用于武器附魔，非常珍贵。',
      choices: [
        { text: '我想去采集水晶', nextNodeId: 'accept_crystal', questTrigger: 'q_crystal_mining' },
        { text: '还是先帮你夺回遗迹吧', nextNodeId: 'reclaim' },
      ],
    },
    accept_crystal: {
      id: 'accept_crystal',
      text: '水晶矿脉在山脉东部的峡谷里。小心那里的石巨人，它们会保护自己领地的矿石。采集8份水晶就够了。',
      isEnd: true,
    },
    farewell: {
      id: 'farewell',
      text: '没关系。铁砧山脉等得了，等你准备好了再来。',
      isEnd: true,
    },
  },
};

/** Zone 4: 灼热沙漠 — 沙漠游牧民 (quest_nomad) */
export const nomadDialogueTree: DialogueTree = {
  startNodeId: 'root',
  nodes: {
    root: {
      id: 'root',
      text: '旅行者，你竟然穿越了沙暴来到这里...你比大多数人勇敢。灼热沙漠正被火焰吞噬。',
      choices: [
        { text: '火焰？这不是正常的沙漠吗？', nextNodeId: 'fire_explain' },
        { text: '我来探索这片沙漠', nextNodeId: 'explore' },
        { text: '你们游牧民怎么在这里生存？', nextNodeId: 'survival' },
      ],
    },
    fire_explain: {
      id: 'fire_explain',
      text: '不，这不正常。沙漠深处有一道火焰裂隙在不断扩大，释放出大量火焰元素。如果不封印它，整片沙漠都会变成熔岩地狱。',
      choices: [
        { text: '我来帮你封印裂隙', nextNodeId: 'seal_path' },
        { text: '火焰元素有多危险？', nextNodeId: 'fire_danger' },
        { text: '有没有更简单的任务？', nextNodeId: 'simple_tasks' },
      ],
    },
    explore: {
      id: 'explore',
      text: '勇气可嘉！沙漠分为烈焰荒地和蝎谷两个主要区域。烈焰荒地有大量火焰元素，蝎谷则盘踞着巨型蝎子。',
      choices: [
        { text: '我先去侦察地形', nextNodeId: 'accept_explore', questTrigger: 'q_explore_desert' },
        { text: '沙漠里有水源吗？', nextNodeId: 'water' },
      ],
    },
    survival: {
      id: 'survival',
      text: '我们靠绿洲生存。沙漠中有一片隐藏的绿洲，那是整个沙漠中唯一安全的水源地。但最近火焰元素开始向绿洲逼近了。',
      choices: [
        { text: '我可以帮你保护绿洲', nextNodeId: 'protect_oasis' },
        { text: '绿洲在哪里？', nextNodeId: 'oasis_location', prereqQuests: ['q_kill_fire_elementals'] },
      ],
    },
    seal_path: {
      id: 'seal_path',
      text: '要封印裂隙，你需要先消灭沙漠中的火焰元素削弱火焰之力，然后找到隐藏绿洲中的古老力量，最后击败守护裂隙的凤凰。',
      choices: [
        { text: '我先去消灭火焰元素', nextNodeId: 'accept_fire', questTrigger: 'q_kill_fire_elementals', prereqQuests: ['q_explore_desert'] },
        { text: '先让我了解一下沙漠地形', nextNodeId: 'accept_explore', questTrigger: 'q_explore_desert' },
      ],
    },
    fire_danger: {
      id: 'fire_danger',
      text: '火焰元素免疫火焰伤害，物理攻击对它们效果有限。冰系魔法是克制它们的最好方式。它们的核心在身体中央，打碎它就能消灭一只。',
      choices: [
        { text: '了解了，我去对付它们', nextNodeId: 'accept_fire', questTrigger: 'q_kill_fire_elementals', prereqQuests: ['q_explore_desert'] },
        { text: '我需要先准备冰系装备', nextNodeId: 'farewell' },
      ],
    },
    simple_tasks: {
      id: 'simple_tasks',
      text: '当然。沙漠里水源稀缺，如果你能击败一些怪物搜集水囊，那就帮了大忙了。另外蝎毒也是珍贵的材料。拿着这些沙漠补给上路吧。',
      choices: [
        { text: '我去收集水源（获得补给）', nextNodeId: 'accept_water', questTrigger: 'q_water_supply', reward: { gold: 80, exp: 150 } },
        { text: '我去采集蝎毒', nextNodeId: 'accept_venom', questTrigger: 'q_scorpion_venom' },
        { text: '还是先了解沙漠情况吧', nextNodeId: 'accept_explore', questTrigger: 'q_explore_desert' },
      ],
    },
    accept_explore: {
      id: 'accept_explore',
      text: '白天的沙暴会遮蔽视线，尽量在沙暴间隙移动。记住，如果迷路了就往东走，绿洲在东南方。',
      isEnd: true,
    },
    water: {
      id: 'water',
      text: '沙漠中没有天然水源，只有绿洲里有水。不过击败的怪物身上有时会掉落净化水囊，那也是宝贵的补给。',
      choices: [
        { text: '我去收集水源', nextNodeId: 'accept_water', questTrigger: 'q_water_supply' },
        { text: '我先去探索沙漠', nextNodeId: 'accept_explore', questTrigger: 'q_explore_desert' },
      ],
    },
    protect_oasis: {
      id: 'protect_oasis',
      text: '如果你真的愿意帮忙，先去消灭沙漠中的火焰元素。它们是对绿洲最大的威胁。',
      choices: [
        { text: '我先去侦察沙漠', nextNodeId: 'accept_explore', questTrigger: 'q_explore_desert' },
      ],
    },
    oasis_location: {
      id: 'oasis_location',
      text: '绿洲藏在沙漠东南方的一片沙丘后面。那里有古老的神殿遗迹，也许能找到封印火焰的线索。',
      choices: [
        { text: '我这就去绿洲', nextNodeId: 'accept_oasis', questTrigger: 'q_explore_oasis' },
        { text: '我先处理其他事情', nextNodeId: 'farewell' },
      ],
    },
    accept_oasis: {
      id: 'accept_oasis',
      text: '小心绿洲附近的沙虫，它们在地下活动，突然出现时很危险。',
      isEnd: true,
    },
    accept_fire: {
      id: 'accept_fire',
      text: '消灭12只火焰元素应该能削弱火焰裂隙的力量。它们主要出没在烈焰荒地区域。',
      isEnd: true,
    },
    accept_water: {
      id: 'accept_water',
      text: '收集5份净化水囊，击败沙漠中的怪物就有机会获得。我们的营地急需淡水补给。',
      isEnd: true,
    },
    accept_venom: {
      id: 'accept_venom',
      text: '蝎谷里有大量沙漠蝎子。击败8只并收集5份蝎毒。小心它们的尾刺，毒性很强！',
      isEnd: true,
    },
    farewell: {
      id: 'farewell',
      text: '沙漠不等人，旅行者。希望你下次来时能帮上忙。',
      isEnd: true,
    },
  },
};

/** Zone 5: 深渊裂隙 — 深渊守望者 (quest_warden) */
export const wardenDialogueTree: DialogueTree = {
  startNodeId: 'root',
  nodes: {
    root: {
      id: 'root',
      text: '你...你竟然来到了深渊裂隙的边缘。这里是凡间与地狱的交界处。恶魔大军正在集结，我们的时间不多了。',
      choices: [
        { text: '深渊裂隙是怎么形成的？', nextNodeId: 'origin' },
        { text: '我来封印裂隙', nextNodeId: 'seal_plan' },
        { text: '这里有多危险？', nextNodeId: 'danger' },
      ],
    },
    origin: {
      id: 'origin',
      text: '千年前，一位堕落的大魔法师为了获得永恒的力量，打开了通往深渊的传送门。我们的先辈封印了它，但封印正在崩溃。如果不重新封印，恶魔将涌入人间。',
      choices: [
        { text: '告诉我封印的方法', nextNodeId: 'seal_plan' },
        { text: '堕落的魔法师现在在哪？', nextNodeId: 'fallen_mage' },
      ],
    },
    seal_plan: {
      id: 'seal_plan',
      text: '要重新封印裂隙，你需要：一，探索深渊的三大区域找到封印碎片；二，消灭恶魔收集它们的精华作为封印材料；三，击败深渊领主，它是维持裂隙的核心力量。',
      choices: [
        { text: '我先去探索深渊', nextNodeId: 'accept_explore', questTrigger: 'q_explore_abyss' },
        { text: '直接去打恶魔', nextNodeId: 'direct_fight', prereqQuests: ['q_explore_abyss'] },
        { text: '我需要更多准备时间', nextNodeId: 'prepare' },
      ],
    },
    danger: {
      id: 'danger',
      text: '极度危险。深渊中有小恶魔、次级恶魔、魅魔...还有深渊领主本身。这里的空气都带有腐蚀性，普通人一刻都待不了。你最好确保自己足够强大。',
      choices: [
        { text: '我已经准备好了', nextNodeId: 'seal_plan' },
        { text: '有什么能帮助我抵抗腐蚀的？', nextNodeId: 'resistance' },
      ],
    },
    fallen_mage: {
      id: 'fallen_mage',
      text: '他已经不是人了。经过千年的深渊腐蚀，他变成了深渊领主——这片区域最强大的恶魔。要封印裂隙，必须击败他。',
      choices: [
        { text: '我来挑战深渊领主', nextNodeId: 'seal_plan' },
        { text: '听起来很艰难...', nextNodeId: 'encourage' },
      ],
    },
    accept_explore: {
      id: 'accept_explore',
      text: '裂隙入口在北部，恶魔尖塔在东部，混沌王座在南部最深处。每个区域都有封印碎片的线索。记住，在深渊中不要停留太久。',
      isEnd: true,
    },
    direct_fight: {
      id: 'direct_fight',
      text: '勇敢！但别冲动。先消灭周围的小恶魔和次级恶魔，收集恶魔精华来增强封印的力量。',
      choices: [
        { text: '好，我去驱逐恶魔', nextNodeId: 'accept_demons', questTrigger: 'q_kill_demons' },
        { text: '我也想顺便收集虚空水晶', nextNodeId: 'accept_crystals', questTrigger: 'q_void_crystals' },
      ],
    },
    prepare: {
      id: 'prepare',
      text: '明智之举。你可以先在深渊外围做些准备任务。清除一些小恶魔，收集虚空水晶来强化你的装备。这是守望者的紧急物资，拿去用吧。',
      choices: [
        { text: '感谢补给，我去清除小恶魔', nextNodeId: 'accept_souls', questTrigger: 'q_corrupted_souls', reward: { gold: 150, exp: 300 } },
        { text: '虚空水晶在哪里？', nextNodeId: 'crystal_location' },
        { text: '还是直接进去吧', nextNodeId: 'accept_explore', questTrigger: 'q_explore_abyss' },
      ],
    },
    resistance: {
      id: 'resistance',
      text: '虚空水晶能提供一定的深渊腐蚀抵抗。另外，如果你能找到陨落英雄留下的遗物，可能也有帮助。他们曾是封印裂隙的守卫者。',
      choices: [
        { text: '我去收集虚空水晶', nextNodeId: 'accept_crystals', questTrigger: 'q_void_crystals' },
        { text: '我去寻找英雄遗物', nextNodeId: 'accept_hero', questTrigger: 'q_fallen_hero', prereqQuests: ['q_explore_abyss'] },
        { text: '我已经足够强了', nextNodeId: 'seal_plan' },
      ],
    },
    encourage: {
      id: 'encourage',
      text: '我理解你的顾虑。但请记住，你不是一个人在战斗。整个世界都在依靠像你这样的勇士。每消灭一只恶魔，裂隙就弱一分。',
      choices: [
        { text: '你说得对，我不会退缩', nextNodeId: 'seal_plan' },
        { text: '我需要先变得更强', nextNodeId: 'prepare' },
        { text: '让我再考虑一下', nextNodeId: 'farewell' },
      ],
    },
    accept_demons: {
      id: 'accept_demons',
      text: '消灭20只小恶魔和10只次级恶魔。它们主要聚集在裂隙入口和恶魔尖塔附近。小心魅魔的魅惑魔法！',
      isEnd: true,
    },
    accept_crystals: {
      id: 'accept_crystals',
      text: '虚空水晶散落在深渊的各个角落。收集10份应该足够了。它们发出淡紫色的光芒，很好辨认。',
      isEnd: true,
    },
    accept_souls: {
      id: 'accept_souls',
      text: '小恶魔虽然单个不强，但数量众多。消灭15只可以有效减轻深渊的腐蚀强度。',
      isEnd: true,
    },
    crystal_location: {
      id: 'crystal_location',
      text: '虚空水晶主要分布在深渊西部的悬崖边。那里空间扭曲最严重，水晶也最密集。收集10份就够用了。',
      choices: [
        { text: '我去收集虚空水晶', nextNodeId: 'accept_crystals', questTrigger: 'q_void_crystals' },
        { text: '我先去探索深渊', nextNodeId: 'accept_explore', questTrigger: 'q_explore_abyss' },
      ],
    },
    accept_hero: {
      id: 'accept_hero',
      text: '陨落神殿在深渊南部，英雄纪念碑在东部。两处都有先辈留下的遗物和线索。',
      isEnd: true,
    },
    farewell: {
      id: 'farewell',
      text: '深渊不会等人。尽快做好准备回来找我。',
      isEnd: true,
    },
  },
};

/** Map NPC IDs to their dialogue trees. */
export const DialogueTrees: Record<string, DialogueTree> = {
  quest_elder: elderDialogueTree,
  quest_scout: scoutDialogueTree,
  quest_dwarf: dwarfDialogueTree,
  quest_nomad: nomadDialogueTree,
  quest_warden: wardenDialogueTree,
};
