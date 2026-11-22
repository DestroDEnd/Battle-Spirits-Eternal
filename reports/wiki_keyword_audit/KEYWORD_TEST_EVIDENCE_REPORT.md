# KEYWORD TEST EVIDENCE REPORT

## Overview
This report audits the existing test coverage across all 244 test suites for every keyword.
Tests are classified strictly according to evidence tier:
- **T0**: No evidence found in test files.
- **T1**: Recognition only (catalog assertion, regex extraction check).
- **T2**: Handler test (direct call to handler method using synthetic objects).
- **T3**: Integration test (exercises game engine execution path using synthetic cards).
- **T4**: Real-card end-to-end (exercises real card from sharded DB through compiler, activation, targeting and resolution).

### Test Quality Summary
- **T0 (No Evidence)**: 234 keywords
- **T1 (Recognition Only)**: 13 keywords
- **T2 (Direct Handler Test)**: 0 keywords
- **T3 (Integration Synthetic)**: 69 keywords
- **T4 (Real-Card End-to-End)**: 32 keywords

## Keywords with T4 (Real-Card End-to-End) Coverage
### Accel (WIKI-002)
- **Category**: All / General
- **Test Files**: `tests/accel_mechanics.test.js`, `tests/arena_ir_shard_loader.test.js`, `tests/identity_consumer_compatibility.test.js`, `tests/keyword_registry.test.js`, `tests/m4_modern_ops.test.js`
- **Real Card Examples in Corpus**: BATTLE-SPIRITS-A21 (Avatar Dragon Green), BS43-X01 (The CreationDragonDeity Grand-Siegfried), BS42-X05 (The WonderKing Siegfried-Madhatter)

### Advent (WIKI-003)
- **Category**: All / General
- **Test Files**: `tests/advent_mechanics_and_cards.test.js`, `tests/advent_saga_handlers.test.js`, `tests/chronological_phases/phase_10_2017.test.js`, `tests/contract_advent_modal_and_timing.test.js`, `tests/engine_core.test.js`
- **Real Card Examples in Corpus**: SD45-CP05 (Magnadramon), CB05-043 (Azulongmon), SD39-X01 (The NobleDragoon Nu-Siegfried)

### Change (WIKI-007)
- **Category**: All / General
- **Test Files**: `tests/keyword_registry.test.js`, `tests/phase2b1_corrective_patch.test.js`, `tests/phase4a_structured_conditions.test.js`, `tests/phase_k_evidence_adversarial.test.js`, `tests/real_browser_arena.test.js`
- **Real Card Examples in Corpus**: CB04-056 (4Koma Ninpoutou), CB19-045 (50th Kamen Rider Decade), CB05-052 (Imperialdramon Dragon Mode)

### Charge (WIKI-008)
- **Category**: All / General
- **Test Files**: `tests/bs19_card_effects.test.js`, `tests/engine_discrepancy_audit.test.js`, `tests/keywords_waves4_5_6.test.js`, `tests/m4_modern_ops.test.js`, `tests/physical_ability_identity_corrective.test.js`
- **Real Card Examples in Corpus**: BS20-038 (Cupid), BS19-X06 (The BattleRadiantGod Soldnerg), BS23-X01 (The DragonShineDeity Shining-Dragon-Overray)

### Contract Advent (WIKI-009)
- **Category**: All / General
- **Test Files**: `tests/advent_mechanics_and_cards.test.js`, `tests/contract_advent_modal_and_timing.test.js`, `tests/keywords_waves4_5_6.test.js`, `tests/phase10_combat_braves_utrigger.test.js`, `tests/phase11_clash_flash_grant_status.test.js`
- **Real Card Examples in Corpus**: CB28-X02 (Burning Godzilla (1995)), BS64-XV01 (The DragonEmperor Siegfried XV), SD66-X01 (The PinnacleDragonEmperor Siegfried-Zenith)

### Flag Contract Advent (WIKI-015)
- **Category**: All / General
- **Test Files**: `tests/advent_mechanics_and_cards.test.js`, `tests/keywords_waves4_5_6.test.js`
- **Real Card Examples in Corpus**: BS76-023 (Airs-Cheetah), BS76-027 (Airs-Lycaon), BS76-015 (Death Maria)

### Rebirth (WIKI-024)
- **Category**: All / General
- **Test Files**: `tests/bs15_card_effects.test.js`, `tests/chronological_phases/phase_13_2020.test.js`, `tests/chronological_phases/phase_14_2021.test.js`, `tests/keyword_condition_and_face_bindings.test.js`, `tests/m4_modern_ops.test.js`
- **Real Card Examples in Corpus**: BS58-007 (Schwarzer Dragon), BS55-TCP07 (Bloodshed Blade), BS55-TCP05 (Chivalry Slash)

### Rush (WIKI-027)
- **Category**: All / General
- **Test Files**: `tests/heroes_saga_handlers.test.js`, `tests/keywords_comprehensive_audit.test.js`, `tests/sd44_card_effects.test.js`, `tests/terra_dragon_and_keywords.test.js`, `tests/work_package_k1_batch_02_conditions.test.js`
- **Real Card Examples in Corpus**: BS41-040 (Gunsmith-Mime), SD44-X02 (The DarkKingMachineBeast Darkness-Griffon X), BS59-025 (Caucasus Eagle)

### Six Heaven Rush (WIKI-032)
- **Category**: All / General
- **Test Files**: `tests/keywords_comprehensive_audit.test.js`
- **Real Card Examples in Corpus**: SD57-CP01 (Tenma Nobunaga), BSC48-X09 (The HeavenlyDemonKing God-Sechs X -Type Destroy-), BSC48-XX01 (The HeavenlyDemonKing God-Sechs X -Type The End-)

### Ultimate Trigger (WIKI-061)
- **Category**: All / Ultimate
- **Test Files**: `tests/free_summon_without_cost.test.js`, `tests/keyword_registry.test.js`, `tests/phase10_combat_braves_utrigger.test.js`, `tests/phase11_clash_flash_grant_status.test.js`, `tests/sd19_card_effects.test.js`
- **Real Card Examples in Corpus**: SD19-X01 (Ultimate-Siegfried), SJ14-02 (Ultimate-Siegfried-Neo), CP14-X02R (The DarkDragonEmperor Ultimate-Siegfried)

### Core Charge (WIKI-071)
- **Category**: All / Nexus
- **Test Files**: `tests/engine_discrepancy_audit.test.js`, `tests/keywords_waves4_5_6.test.js`, `tests/m4_modern_ops.test.js`, `tests/physical_ability_identity_corrective.test.js`, `tests/sd46_card_effects.test.js`
- **Real Card Examples in Corpus**: BATTLE-SPIRITS-A20 (Avatar Dragon Blue), BATTLE-SPIRITS-A22 (Avatar Dragon Red), BATTLE-SPIRITS-A24 (Avatar Dragon Yellow)

### Release (WIKI-077)
- **Category**: All / Nexus
- **Test Files**: `tests/alternate_card_artworks.test.js`, `tests/identity_consumer_compatibility.test.js`, `tests/identity_subsystem_e2e_acceptance.test.js`, `tests/phase_k_engine_invariants.test.js`, `tests/public_release_e2e_match.test.js`
- **Real Card Examples in Corpus**: BS58-070-A1488 (The Knight and Machine's Grandstone), BS59-070 (The Nebula's Grandstone), BS59-071 (Chrownos' Grandstone)

### Burst (WIKI-086)
- **Category**: All / Burst Area
- **Test Files**: `tests/adversarial_m3_stress.test.js`, `tests/arena_ir_shard_loader.test.js`, `tests/booster_set_saga_handlers.test.js`, `tests/bs14_card_effects.test.js`, `tests/bs15_card_effects.test.js`
- **Real Card Examples in Corpus**: BATTLE-SPIRITS-A10 (Evil Cherubimon), BS52-010 (Ancient Dragon Febrani), SD69-006 (Avatar Create)

### Catalyze (WIKI-089)
- **Category**: All / Burst Area
- **Test Files**: `tests/keywords_comprehensive_audit.test.js`
- **Real Card Examples in Corpus**: BS38-CP04 (Departed Soul), SD31-015 (Double Body Swap), BS32-072 (Flame Slash)

### Mirage (WIKI-091)
- **Category**: All / Burst Area
- **Test Files**: `tests/adversarial_m3_stress.test.js`, `tests/core_game_rules_integrity_corrective.test.js`, `tests/free_summon_mechanics.test.js`, `tests/keyword_registry.test.js`, `tests/m4_modern_ops.test.js`
- **Real Card Examples in Corpus**: P23-05 (...It's Delicious), CB19-045 (50th Kamen Rider Decade), BS59-036 (Cosmo Mastodon)

### Soul Burst (WIKI-092)
- **Category**: All / Burst Area
- **Test Files**: `tests/keywords_comprehensive_audit.test.js`, `tests/work_package_k1_5_foundation_closure.test.js`
- **Real Card Examples in Corpus**: BS43-X04 (The DarkStones MachineBeastDeity Fenrig), PX26-02 (Pit Reporter, Polish), BSC30-022 (The CleverMachineCannon Kunikuzushi)

### Awaken (WIKI-097)
- **Category**: Red / General
- **Test Files**: `tests/booster_set_saga_handlers.test.js`, `tests/bs01_card_effects.test.js`, `tests/bs02_card_effects.test.js`, `tests/bs04_card_effects.test.js`, `tests/bs06_card_effects.test.js`
- **Real Card Examples in Corpus**: BS01-X01 (The DragonEmperor Siegfried), BS04-004 (DarkDinohound), BS04-089 (Great Link)

### Clash (WIKI-100)
- **Category**: Red / General
- **Test Files**: `tests/adversarial_evidence_validation.test.js`, `tests/bs02_card_effects.test.js`, `tests/bs07_card_effects.test.js`, `tests/bs09_card_effects.test.js`, `tests/bs12_card_effects.test.js`
- **Real Card Examples in Corpus**: KF-01 (Colonel-Dragon), SD01-003 (Ankillersaurus), SD06-003 (One-Kengo)

### Consecutive Blade (WIKI-102)
- **Category**: Red / General
- **Test Files**: `tests/keywords_comprehensive_audit.test.js`
- **Real Card Examples in Corpus**: BS31-004 (Haganewurm), BS33-072 (One-Shot Sure-Hit Draw), LM15-03 (The SengokuSmallDragon Soul War Lizard)

### Toppa Awaken (WIKI-136)
- **Category**: Red / General
- **Test Files**: `tests/keywords_comprehensive_audit.test.js`, `tests/keyword_condition_and_face_bindings.test.js`
- **Real Card Examples in Corpus**: SD66-CX01 (Top Buddy, Aibou)

### True-Awaken (WIKI-137)
- **Category**: Red / General
- **Test Files**: `tests/keywords_comprehensive_audit.test.js`, `tests/real_card_semantic_validation.test.js`, `tests/sd19_card_effects.test.js`
- **Real Card Examples in Corpus**: SD19-X01 (Ultimate-Siegfried)

### True-Consecutive Blade (WIKI-139)
- **Category**: Red / General
- **Test Files**: `tests/keywords_comprehensive_audit.test.js`
- **Real Card Examples in Corpus**: BS34-X01 (The SengokuDragonEmperor Burning-Souldragon)

### Curse (WIKI-152)
- **Category**: Purple / General
- **Test Files**: `tests/arena_lobby_deck_hydration.test.js`, `tests/arena_standard_decks_match_simulation.test.js`, `tests/bs02_card_effects.test.js`, `tests/bs06_card_effects.test.js`, `tests/engine_core.test.js`
- **Real Card Examples in Corpus**: SD01-036 (Curse Enchant), BS02-015 (Humpdump), BS02-020 (Lady-Frankelly)

### High Speed (WIKI-180)
- **Category**: Green / General
- **Test Files**: `tests/advent_mechanics_and_cards.test.js`, `tests/bs02_card_effects.test.js`, `tests/bs03_card_effects.test.js`, `tests/bs04_card_effects.test.js`, `tests/bs06_card_effects.test.js`
- **Real Card Examples in Corpus**: CB05-021 (Kuwagamon), BS19-X03 (The BlackInsectDemonLord Diabolica-Mantis), BSC19-017 (Fairy Mothra)

### Leap (WIKI-183)
- **Category**: Green / General
- **Test Files**: `tests/keywords_comprehensive_audit.test.js`, `tests/keywords_waves4_5_6.test.js`
- **Real Card Examples in Corpus**: BATTLE-SPIRITS-A11787 (The RabbitTwelveGodKing Mistral-Bit)

### Whirlwind (WIKI-197)
- **Category**: Green / General
- **Test Files**: `tests/keywords_comprehensive_audit.test.js`, `tests/keyword_condition_and_face_bindings.test.js`, `tests/work_package_k1_batch_03_keywords_prerequisites.test.js`
- **Real Card Examples in Corpus**: BS41-076 (The Expansive Hill), BATTLE-SPIRITS-A11124 (The KingBeastTribe Blade Youth), SJ17-08 (The TwinkleForestKing AncientWolf)

### Armor (WIKI-199)
- **Category**: White / General
- **Test Files**: `tests/bs02_card_effects.test.js`, `tests/bs03_card_effects.test.js`, `tests/bs05_card_effects.test.js`, `tests/bs06_card_effects.test.js`, `tests/bs09_card_effects.test.js`
- **Real Card Examples in Corpus**: CB05-056 (D-3), CB05-039 (Digmon), CB05-006 (Flamedramon)

### Fortress (WIKI-208)
- **Category**: White / General
- **Test Files**: `tests/core_game_rules_engine.test.js`, `tests/keywords_comprehensive_audit.test.js`, `tests/phase_k1_source_zone_precedence.test.js`, `tests/sd39_card_effects.test.js`, `tests/standard_deck_white.test.js`
- **Real Card Examples in Corpus**: AVALANCHE-BISON (The OxTwelveGodKing Avalanche-Bison)

### Heavy Armor (WIKI-211)
- **Category**: White / General
- **Test Files**: `tests/bs13_card_effects.test.js`, `tests/bs19_card_effects.test.js`, `tests/constellation_saga_handlers.test.js`, `tests/engine_core.test.js`, `tests/keyword_condition_and_face_bindings.test.js`
- **Real Card Examples in Corpus**: CB02-033 (Andromon), CB34-022 (Dragon Orphnoch Dragonoid Form), BATTLE-SPIRITS-A270 (The DarkStones DarkfearSlashDeity Dinovenge)

### True Fortress (WIKI-225)
- **Category**: White / General
- **Test Files**: `tests/keywords_comprehensive_audit.test.js`
- **Real Card Examples in Corpus**: BS76-X08 (The OxTwelveGodKing Avalanche-Bison X)

### Holy Life (WIKI-240)
- **Category**: Yellow / General
- **Test Files**: `tests/bs07_card_effects.test.js`, `tests/engine_discrepancy_audit.test.js`, `tests/keyword_registry.test.js`, `tests/m4_modern_ops.test.js`, `tests/work_package_k1_batch_03_keywords_prerequisites.test.js`
- **Real Card Examples in Corpus**: CB05-042 (Hippogriffomon), BS22-X05 (The EvilSacredBeast Chaos-Pegasuros), BATTLE-SPIRITS-A1428 (The Heaven'sDeity Glorious-Solute)

### Crush (WIKI-254)
- **Category**: Blue / General
- **Test Files**: `tests/booster_set_saga_handlers.test.js`, `tests/bs03_card_effects.test.js`, `tests/bs08_card_effects.test.js`, `tests/bs11_card_effects.test.js`, `tests/constellation_saga_handlers.test.js`
- **Real Card Examples in Corpus**: BS39-076 (Boar Up), BS03-143 (Blitz), BS08-083 (Break Burst)


## Keywords with T2 (Direct Handler Call / Synthetic) Coverage

## Keywords with T0 (Zero Test Evidence)
Absolute Unleash, Astral Unleash, Astromulet, Celestial Unleash, Count Break, Contract Unleash, Creator Unleash, Dark Esoterica, Extreme Drive, Grand Advent, Horoscoping, Illusive Rebirth, Minor Unleash, Primordial Unleash, Pyroxene Esoterica, Pyroxene Seal, Return to Prime, Reverse Contract Advent, Seal Flag Contract Advent, Seal Manifest, Six Heaven Rebirth, Tenma Advent, Tenma-Kagemusha, Twinkle Dragonpulse, Twinkle Seal, Twinkle Trace, Ultra Contract Advent, Ultra Manifest, Double Hit, Double Ultimate Trigger, Double Count Ultimate Trigger, Final Contract Advent, Great Unsheathe, Light-Dark Soul Drive, Octa Ultimate Trigger, Quadruple Hit, Quadruple Ultimate Trigger, Triple Hit, Triple Ultimate Trigger, Ultimate Energy, Ultimate Hand, Ultimate Unsheathe, Spirit Soul, Brave Engage, Constellation Seal, Contract Field, Contract Skill, Grandphosis, Grand Field, Grand Mystery, Terra Manifest, Type: Field, Type: Flower, Type: Song, Type: Vision, Burst Seal, Burst Tribute, Kamiumi Unleash, True Catalyze, Twinkle Catalyze, War Catalyze, Yomi Unleash, Bombardment-Zero, Clash X, Consecutive Dominance, Contract Awaken, Crimson Awaken, Dark Unleash, Dragon Awaken, Dragonshot, Emperor Road, Flame Unleash, Furious Charge, Genesis, Grand Bombardment, Great Pursuit, Infinite Blade, Infinite Flame, Infinite Unleash, Martial Unleash, Mirage Boost, Phantom Awaken, Phantom Return, Pyro Drive, Rekka Consecutive Blade, Rekka Showdown, Shining Heaven Unleash, Sol Awaken, Solar Unleash, Soul Unleash, Super Boost, Super Seal, Super Unleash, Thunder God Bombardment, True-Drive, True Infinite Flame, True Genesis, Twinkle Bombardment, Twinkle Clash, Ultra Assault, Ultra Clash, Vermillion Furious Charge, Banner God-Army, Banner God Strike, Corpse Unleash, Curse Unleash, Dark Assault, Devil Unleash, Grudging Curse, Hollow Sky, Illusive Immortality, Mirage Drain, Nether Immortality, Nether Unleash, Slayer Unleash, True Spellbind, Twinkle Necromancy, Twinkle Spellbind, Absolute Sound Speed, Flashing Swift, Grand Soar, Grand Twinkle Soar, High Speed Seal, High Speed - Mystery, Mystery Seal, Sky Seal, Soul Swift, Soul Swift - Love, Sound Speed, Sound Speed Seal, Thundering Soar, Thunder Swift, True-Soar, Twinkle Body Substitution, Twinkle Soar, Aurora Armor, Bombardment-D, Contract Armor, Count Armor, Cycle Force Unleash, Grand Ice Wall, Grand Leap, Ice Unleash, Illusive Armor, Illusive Ultra Heavy Armor, Knight Armor, Mirage Synchro, Moon Unleash, Moonlight Seal, Silver Awaken, Steel Load, True-Kagemusha, Twinkle Equip, Twinkle Fortress, Ultra Excite, Ultra Heavy Armor, Chaotic Holy Life, Contract Reload, Divine Holy Life, Evil Light, Heavenly Light, Heaven Holy Life, Imaginate Seal, Mirage Flash, Six Pentan Rush, Thunder Unleash, Twinkle Revolution, Ultra Thunder Advent, Violent Windstorm, Chaos Unleash, Chrono-Count Break, Great Assault, Great Twinkle Navigation, Mirage Trance, Roaring Assault, Roaring Stampede, Silver Arm Unleash, Time Unleash, True Plunder, Wave Crush, XV Crush, Chaos Stage, Charge Song, Contract Duet Part, CoZ12 Part, Curtain Call, Diva Rush, Fleur Part, Grand Stage, Resonance, Resonance Blast, RioRia Blast, Solo Stage, Spellsong, Zero Rebirth, Aikatsu On Stage, Constellation Appeal, Fever Appeal, Friendshipower, Love Me Zone, Moon On The Stage, Starlight Appeal, Star Appeal, Armor Digivolution, DNA Digivolution, Super Digivolution, Card Slash, A.T. Field, G.A.T. Field, Sortie Rebirth, Armed Intervention, Bushido, Exchange, NT-D, PS Armor, Quantum Burst, Top Gun, TP Armor, VPS Armor, Yata-no-Kagami, Cast Off, Chou Henshin, Dan Kuroto Deus Advent, Hyper Cast Off, Hyper Clock Up, Time Vent, Type: Driver, Absolute Rebirth, MD Armor, Re Awaken, Soul Awaken, Fish Troop, Camouflage, Ringing Charge
