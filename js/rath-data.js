/**
 * Rath RPG Game Data
 * Aptitudes, equipment, and other reference data
 */

const RATH_DATA = {
  skillAptitudes: {
    "Melee Combat": [
      { name: "Cleave", description: "Reduce enemy to 0 HP → free attack on another enemy in close range. Chain until you miss, run out of targets, or reach L attacks" },
      { name: "Protect", description: "Ally in close range hit → intercept as reaction, take the damage. With shield: CON test DC 12 for half damage" },
      { name: "Resilient", description: "+2 HP per level. Advantage vs stunned/dazed/unconscious" },
      { name: "Duelist", description: "Crit range 18-20. Advantage when fighting 1-on-1" },
      { name: "Second Wind", description: "Once per short rest, action to recover L × 1d6 HP" },
      { name: "Berserker", description: "L times/long rest, rage as free action. While raging: +1 melee damage, advantage on STR tests. Ends when combat ends or you choose" }
    ],
    "Ranged Combat": [
      { name: "Hawkeye", description: "Miss with bow → next attack has advantage" },
      { name: "Marksman", description: "Action to aim (give up attack) → next ranged attack has advantage + 1d6 damage" }
    ],
    "Assassin": [
      { name: "Backstab", description: "Attack unaware target or with advantage → dagger deals extra damage dice (1 die at L1-4, 2 dice at L5-8, 3 dice at L9-10)" },
      { name: "Dagger Master", description: "Always have a dagger. Only dagger (no shield/other weapons): +1 AC, advantage vs larger weapons once per combat" }
    ],
    "Exploration": [
      { name: "Break and Enter", description: "Advantage to pick locks and disable traps with thieves' tools. Complex traps/locks: roll normally. Can attempt without tools at disadvantage" },
      { name: "Move Silently and Unseen", description: "Advantage to sneak, hide, move quietly, remain undetected" },
      { name: "Wild Walker", description: "Advantage to track, hunt, forage, navigate in natural wilderness" },
      { name: "Dungeon Sense", description: "Advantage to detect traps, secret doors, unusual construction. Learn trap details when searching. Know depth and direction underground" }
    ],
    "Social": [
      { name: "Silver Tongue", description: "Advantage on CHA to negotiate, improve reactions, convince (not against core interests)" }
    ],
    "Divine": [
      { name: "Heal", description: "Once per short rest, tend creature 10 minutes → heal (L+1)d6 + WIS HP" },
      { name: "Turn Undead", description: "L times/long rest, WIS test DC 12 → undead in near range with HD ≤ 2d6 + L flee for 1d4 rounds" }
    ],
    "Magic": [
      { name: "Hedge Magic", description: "Minor magical tricks (Candlelight, Spark, Mend, Freshen, Trick). INT test DC 12 to use" },
      { name: "Chartomancer", description: "Cast spells from scrolls. INT test DC 12 to preserve after casting. Start with one level 1 scroll" }
    ]
  },

  inherentAptitudes: {
    "Sensory": [
      { name: "Darkvision", description: "See near distance in pitch darkness" },
      { name: "NightVision", description: "See like daytime if any light exists (starlight counts). Not in total darkness" }
    ],
    "Physical": [
      { name: "Natural Weapons", description: "Claws, teeth, spines. 1d6 + STR damage" },
      { name: "Natural Armor", description: "Scales, plates, hide. +2 AC. Can't wear manufactured armor. Can use shields" },
      { name: "Small", description: "Tiny (object-sized). Advantage to hide/fit tight spaces. -3 inventory slots (min 7). Weapons one die smaller. With Wings: true flight" },
      { name: "Wings", description: "Glide short distances, break falls. Can't fly alone. With Small: true flight" }
    ],
    "Combat": [
      { name: "Tough", description: "Advantage on STR tests" },
      { name: "Shifty", description: "Larger enemy misses → force them to attack another target in range" },
      { name: "Hard to Pin Down", description: "Advantage on opposed DEX tests" },
      { name: "Underfoot", description: "Move through spaces of larger creatures. Larger enemies have disadvantage on opportunity attacks against you" }
    ]
  },

  gearPacks: {
    "Combat": {
      contents: ["Medium armor (+2 AC)", "Standard weapon (d8)", "Shield (+1 AC)", "Torches", "Rations (UD8)"],
      ac_bonus: 3,
      slots_used: 6
    },
    "Scout": {
      contents: ["Light armor (+1 AC)", "Bow (d6)", "Dagger (d6)", "Rope 50ft", "Lantern", "Rations (UD8)"],
      ac_bonus: 1,
      slots_used: 6
    },
    "Caster": {
      contents: ["Staff (d6)", "Candles", "Blank book", "Tinderbox", "Lantern", "Rations (UD8)"],
      ac_bonus: 0,
      slots_used: 4
    },
    "Specialist": {
      contents: ["Light armor (+1 AC)", "2 Daggers (d6)", "Lockpicks", "Rope 50ft", "Grappling hook", "Rations (UD8)"],
      ac_bonus: 1,
      slots_used: 6
    }
  },

  weapons: [
    { name: "Dagger", damage: "d6", slots: 1, notes: "Throwable (near)" },
    { name: "Club/Staff", damage: "d6", slots: 1, notes: "" },
    { name: "Sword", damage: "d8", slots: 2, notes: "d10 two-handed" },
    { name: "Axe", damage: "d8", slots: 2, notes: "d10 two-handed" },
    { name: "Spear", damage: "d8", slots: 2, notes: "d10 two-handed" },
    { name: "Two-handed weapon", damage: "d10", slots: 3, notes: "Knock prone on crit" },
    { name: "Bow", damage: "d6", slots: 2, notes: "Far range" },
    { name: "Crossbow", damage: "d8", slots: 3, notes: "Far range, ignores 2 AC, reload" }
  ],

  armor: [
    { name: "None", ac_bonus: 0, slots: 0 },
    { name: "Light armor", ac_bonus: 1, slots: 2 },
    { name: "Medium armor", ac_bonus: 2, slots: 3 },
    { name: "Heavy armor", ac_bonus: 3, slots: 5 }
  ],

  extras: [
    { name: "Shield", ac_bonus: 1, slots: 1 },
    { name: "Helmet", ac_bonus: 1, slots: 1 }
  ],

  adventuringGear: [
    "Rope 50ft", "Pulleys", "Candles (5)", "Chain 10ft", "Chalk (10)", "Crowbar",
    "Tinderbox", "Grappling hook", "Hammer", "Waterskin", "Lantern", "Lamp oil",
    "Padlock", "Manacles", "Mirror", "Pole 10ft", "Sack", "Tent", "Spikes", "Torches",
    "Air bladder", "Bear trap", "Shovel", "Bellows", "Grease", "Saw", "Bucket",
    "Caltrops", "Chisel", "Drill", "Fake jewels", "Blank book", "Card deck", "Dice set",
    "Cook pots", "Face paint", "Whistle", "Instrument", "Quill & ink", "Small bell",
    "Incense", "Sponge", "Lens", "Perfume", "Horn", "Bottle", "Soap", "Spyglass",
    "Tar pot", "Twine", "Fishing rod", "Marbles", "Glue", "Pick", "Hourglass",
    "Net", "Tongs", "Lockpicks", "Metal file", "Nails"
  ],

  suggestedCombinations: [
    { concept: "Fighter", aptitudes: ["Cleave", "Resilient"], keywords: ["Human", "Fighter"] },
    { concept: "Thief", aptitudes: ["Break and Enter", "Move Silently and Unseen"], keywords: ["Human", "Thief"] },
    { concept: "Ranger", aptitudes: ["Hawkeye", "Wild Walker"], keywords: ["Human", "Ranger"] },
    { concept: "Cleric", aptitudes: ["Heal", "Turn Undead"], keywords: ["Human", "Cleric"] },
    { concept: "Barbarian", aptitudes: ["Berserker", "Resilient"], keywords: ["Human", "Barbarian"] },
    { concept: "Assassin", aptitudes: ["Backstab", "Dagger Master"], keywords: ["Human", "Assassin"] },
    { concept: "Hedge Witch", aptitudes: ["Hedge Magic", "Silver Tongue"], keywords: ["Human", "Witch"] },
    { concept: "Arcanist", aptitudes: ["Chartomancer", "Dungeon Sense"], keywords: ["Human", "Arcanist"] },
    { concept: "Dwarf", aptitudes: ["Darkvision", "Tough"], keywords: ["Dwarf", "Fighter"] },
    { concept: "Elf", aptitudes: ["NightVision", "Hard to Pin Down"], keywords: ["Elf", "Ranger"] },
    { concept: "Halfling", aptitudes: ["Underfoot", "Shifty"], keywords: ["Halfling", "Thief"] },
    { concept: "Pixie", aptitudes: ["Small", "Wings"], keywords: ["Pixie", "Scout"] },
    { concept: "Beastfolk", aptitudes: ["Natural Weapons", "Natural Armor"], keywords: ["Beastfolk", "Warrior"] },
    { concept: "Goblin", aptitudes: ["NightVision", "Underfoot"], keywords: ["Goblin", "Sneak"] }
  ],

  traits: {
    physique: ["Athletic", "Brawny", "Corpulent", "Delicate", "Gaunt", "Hulking", "Lanky", "Ripped", "Rugged", "Scrawny", "Short", "Sinewy", "Slender", "Flabby", "Statuesque", "Stout", "Tiny", "Towering", "Willowy", "Wiry"],
    speech: ["Blunt", "Booming", "Breathy", "Cryptic", "Drawling", "Droning", "Flowery", "Formal", "Gravelly", "Hoarse", "Mumbling", "Precise", "Quaint", "Rambling", "Rapid-fire", "Dialect", "Slow", "Squeaky", "Stuttering", "Whispery"],
    virtue: ["Ambitious", "Cautious", "Courageous", "Courteous", "Curious", "Disciplined", "Focused", "Generous", "Gregarious", "Honest", "Honorable", "Humble", "Idealistic", "Just", "Loyal", "Merciful", "Righteous", "Serene", "Stoic", "Tolerant"],
    vice: ["Aggressive", "Arrogant", "Bitter", "Cowardly", "Cruel", "Deceitful", "Flippant", "Gluttonous", "Greedy", "Irascible", "Lazy", "Nervous", "Prejudiced", "Reckless", "Rude", "Suspicious", "Vain", "Vengeful", "Wasteful", "Whiny"]
  }
};

// Helper function to get all aptitudes as flat list
function getAllAptitudes() {
  const all = [];

  for (const [category, aptitudes] of Object.entries(RATH_DATA.skillAptitudes)) {
    for (const apt of aptitudes) {
      all.push({ ...apt, category, type: 'skill' });
    }
  }

  for (const [category, aptitudes] of Object.entries(RATH_DATA.inherentAptitudes)) {
    for (const apt of aptitudes) {
      all.push({ ...apt, category, type: 'inherent' });
    }
  }

  return all;
}

// Helper to find aptitude by name
function findAptitude(name) {
  return getAllAptitudes().find(a => a.name === name);
}

// Calculate derived stats
function calculateDerivedStats(character) {
  let hp = 10 + (character.stats?.con || 0);
  let ac = 10 + (character.stats?.dex || 0);
  let slots = 10 + (character.stats?.con || 0);

  // Apply aptitude modifiers
  if (character.aptitudes?.includes('Resilient')) {
    hp += 2 * (character.level || 1);
  }
  if (character.aptitudes?.includes('Natural Armor')) {
    ac = 12 + (character.stats?.dex || 0); // Base 12 instead of 10, no manufactured armor
  }
  if (character.aptitudes?.includes('Small')) {
    slots = Math.max(7, slots - 3);
  }

  // Apply armor
  if (character.armor) {
    const armorData = RATH_DATA.armor.find(a => a.name === character.armor);
    if (armorData && !character.aptitudes?.includes('Natural Armor')) {
      ac += armorData.ac_bonus;
    }
  }

  // Apply shield/helmet
  if (character.hasShield) ac += 1;
  if (character.hasHelmet) ac += 1;

  return { hp, ac, slots };
}
