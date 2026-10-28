"""
Battle Spirits Colosseum - Headless AI Trainer & Expectimax Simulation Engine
Inspired by the Game-AI-Development-Toolkit (GADT / Paradoxes) State-Action-Result Architecture.
Runs Monte Carlo self-play simulations and trains heuristic evaluation weights across all 6 Color Archetypes.
"""

import json
import os
import random
import re
import copy
from typing import List, Dict, Any, Tuple, Optional
import standard_decks

# ── DEFAULT / INITIAL HEURISTIC PROFILES PER COLOR ARCHETYPE ──
DEFAULT_ARCHETYPE_PROFILES = {
    "red": {
        "name": "Hero Dragon Aggro (Red)",
        "w_life": 2.8,
        "w_field_bp": 1.4,
        "w_core_advantage": 0.8,
        "w_hand_advantage": 1.0,
        "w_burst_value": 1.5,
        "w_soul_core": 1.2,
        "flash_reserve_buffer": 1,
        "aggro_threshold": 0.35
    },
    "green": {
        "name": "Emerald Ramp (Green - Kingtaurus)",
        "w_life": 2.2,
        "w_field_bp": 1.6,
        "w_core_advantage": 2.0,      # Green heavily prioritizes Void core acceleration
        "w_hand_advantage": 1.2,
        "w_burst_value": 1.2,
        "w_soul_core": 1.5,
        "flash_reserve_buffer": 2,      # Green saves cores for Flash magic / Swift
        "aggro_threshold": 0.45
    },
    "purple": {
        "name": "Netherworld Control (Purple)",
        "w_life": 2.4,
        "w_field_bp": 1.2,
        "w_core_advantage": 1.2,
        "w_hand_advantage": 1.8,      # Purple values drawing and hand advantage
        "w_burst_value": 2.0,         # Heavy reliance on Burst triggers
        "w_soul_core": 1.3,
        "flash_reserve_buffer": 2,
        "aggro_threshold": 0.50
    },
    "white": {
        "name": "Armed Fortress (White)",
        "w_life": 3.2,                 # White prioritizes absolute life defense
        "w_field_bp": 1.3,
        "w_core_advantage": 1.0,
        "w_hand_advantage": 1.1,
        "w_burst_value": 1.8,
        "w_soul_core": 1.4,
        "flash_reserve_buffer": 2,      # Keeps cores for Blizzard Wall / Ice Age Shield
        "aggro_threshold": 0.60
    },
    "yellow": {
        "name": "Celestial Symphony (Yellow)",
        "w_life": 2.5,
        "w_field_bp": 1.1,
        "w_core_advantage": 1.0,
        "w_hand_advantage": 1.6,
        "w_burst_value": 1.7,
        "w_soul_core": 1.2,
        "flash_reserve_buffer": 1,
        "aggro_threshold": 0.40
    },
    "blue": {
        "name": "Colosseum Titans (Blue)",
        "w_life": 2.6,
        "w_field_bp": 1.5,
        "w_core_advantage": 1.1,
        "w_hand_advantage": 1.0,
        "w_burst_value": 1.3,
        "w_soul_core": 1.3,
        "flash_reserve_buffer": 1,
        "aggro_threshold": 0.40
    }
}


def calculate_bp_and_level(levels: List[Dict[str, int]], cores: int) -> Tuple[int, int]:
    """Calculates active Level and BP given core count."""
    if not levels:
        return 1, 2000
    sorted_lvls = sorted(levels, key=lambda x: x.get('cores', 1))
    best_lvl = sorted_lvls[0]
    for lvl in sorted_lvls:
        if cores >= lvl.get('cores', 1):
            best_lvl = lvl
    return best_lvl.get('level', 1), best_lvl.get('bp', 2000)


class SimulationCard:
    """Represents a runtime card instance in headless simulation."""
    def __init__(self, data: Dict[str, Any], uid: str):
        self.uid = uid
        self.name = data.get('name', 'Unknown')
        self.cost = data.get('cost', 2)
        self.type = data.get('type', 'Spirit')
        self.color = data.get('color', 'Red')
        self.effect = data.get('effect', '')
        self.levels = data.get('parsed_levels', [])
        self.current_cores = 0
        self.current_level = 1
        self.current_bp = 2000
        self.is_exhausted = False
        self.has_attacked = False
        self.has_soul_core = False


class SimulationPlayer:
    """Represents one player state in the simulation."""
    def __init__(self, name: str, deck_cards: List[Dict[str, Any]], profile: Dict[str, Any]):
        self.name = name
        self.profile = profile
        self.life = 5
        self.reserve = 4
        self.trash = 0
        self.field: List[SimulationCard] = []
        self.hand: List[SimulationCard] = []
        self.burst: Optional[SimulationCard] = None
        self.soul_core_location = 'reserve'
        
        # Instantiate and shuffle deck
        uid_seq = 1
        raw_list = []
        for c in deck_cards:
            raw_list.append(SimulationCard(c, f"{name}_{uid_seq}"))
            uid_seq += 1
        random.shuffle(raw_list)
        self.deck: List[SimulationCard] = raw_list

        # Initial Draw 4 cards
        for _ in range(min(4, len(self.deck))):
            self.hand.append(self.deck.pop(0))


class BattleSpiritsSimEngine:
    """
    Headless game simulator modeling State-Action-Result transition
    for Battle Spirits matches.
    """
    def __init__(self, p1: SimulationPlayer, p2: SimulationPlayer, max_turns: int = 50):
        self.p1 = p1
        self.p2 = p2
        self.players = [p1, p2]
        self.current_idx = 0
        self.turn = 1
        self.max_turns = max_turns
        self.winner: Optional[SimulationPlayer] = None
        self.logs: List[str] = []

    def get_opponent(self, player: SimulationPlayer) -> SimulationPlayer:
        return self.p2 if player == self.p1 else self.p1

    def run_match(self) -> Tuple[Optional[SimulationPlayer], int, List[str]]:
        """Runs complete simulation until a winner is decided or max turns reached."""
        while self.turn <= self.max_turns and not self.winner:
            active_p = self.players[self.current_idx]
            opp_p = self.get_opponent(active_p)

            # 1. START STEP
            # 2. CORE STEP: Claim 1 core from Void
            active_p.reserve += 1

            # 3. DRAW STEP: Draw 1 card from deck
            if not active_p.deck:
                self.winner = opp_p
                self.logs.append(f"Turn {self.turn}: {active_p.name} decked out!")
                break
            active_p.hand.append(active_p.deck.pop(0))

            # 4. REFRESH STEP: Refresh spirits & return trash cores
            for s in active_p.field:
                s.is_exhausted = False
                s.has_attacked = False
            active_p.reserve += active_p.trash
            active_p.trash = 0
            if active_p.soul_core_location == 'trash':
                active_p.soul_core_location = 'reserve'

            # 5. MAIN STEP (Expectimax Decisions)
            self._execute_main_step(active_p, opp_p)

            # 6. ATTACK STEP (Combat & Lookahead)
            if self.turn > 1: # Official Rule: Player 1 cannot attack on Turn 1
                self._execute_attack_step(active_p, opp_p)

            if self._check_game_over():
                break

            # Next turn
            self.current_idx = 1 - self.current_idx
            self.turn += 1

        if not self.winner:
            # Draw / Turn limit reached -> Pick player with most life
            if self.p1.life > self.p2.life:
                self.winner = self.p1
            elif self.p2.life > self.p1.life:
                self.winner = self.p2

        return self.winner, self.turn, self.logs

    def _execute_main_step(self, player: SimulationPlayer, opp: SimulationPlayer):
        """Simulates intelligent main step: burst setting and optimal summoning."""
        # A. Set Burst if none active and burst card in hand
        if not player.burst:
            burst_cards = [c for c in player.hand if '[Burst:' in c.effect]
            if burst_cards:
                player.burst = burst_cards[0]
                player.hand.remove(burst_cards[0])
                self.logs.append(f"Turn {self.turn}: {player.name} set '{player.burst.name}' as a Burst trap.")

        # B. Identify summonable spirits respecting flash reserve buffer
        buffer = player.profile.get("flash_reserve_buffer", 1)
        while True:
            # Recompute available cores
            available_cores = player.reserve - buffer
            if available_cores <= 0:
                available_cores = player.reserve # use all if no buffer can be kept

            summonable = [
                c for c in player.hand 
                if c.type == 'Spirit' and player.reserve >= (c.cost + 1)
            ]
            if not summonable:
                break

            # Expectimax / Utility evaluation for candidate summons
            best_card = None
            best_score = -999999
            best_cores_to_place = 1

            for c in summonable:
                # Test placing 1 core or aiming for LV2/LV3
                cost = c.cost
                for cores_to_place in [1, 2, 3]:
                    if player.reserve < (cost + cores_to_place):
                        continue
                    lvl, bp = calculate_bp_and_level(c.levels, cores_to_place)
                    # Heuristic score for this summon
                    score = (cost * 1.5) + (bp / 1000.0) * player.profile["w_field_bp"]
                    if 'kingtaurus' in c.name.lower() or 'when summoned' in c.effect.lower():
                        score += 3.0 # High value for When Summoned triggers
                    if score > best_score:
                        best_score = score
                        best_card = c
                        best_cores_to_place = cores_to_place

            if not best_card:
                break

            # Execute summon
            player.hand.remove(best_card)
            player.reserve -= (best_card.cost + best_cores_to_place)
            player.trash += best_card.cost
            lvl, bp = calculate_bp_and_level(best_card.levels, best_cores_to_place)
            best_card.current_cores = best_cores_to_place
            best_card.current_level = lvl
            best_card.current_bp = bp
            best_card.is_exhausted = False
            best_card.has_attacked = False

            # Add to field
            player.field.append(best_card)
            self.logs.append(f"Turn {self.turn}: {player.name} summoned '{best_card.name}' (Lv{lvl}, {bp} BP).")

            # TRIGGER: (When Summoned) Effects
            self._trigger_when_summoned(best_card, player, opp)

    def _trigger_when_summoned(self, card: SimulationCard, player: SimulationPlayer, opp: SimulationPlayer):
        """Simulates When Summoned triggers including Kingtaurus Void ramp."""
        eff = card.effect.lower()
        if '(when summoned)' not in eff and '『このスピリットの召喚時』' not in card.effect:
            return

        # 1. The Duke Kingtaurus: For each other Spirit, put a core from Void to this Spirit
        if 'for each other spirit you control' in eff and 'from the void to this spirit' in eff:
            other_spirits = len([s for s in player.field if s.uid != card.uid])
            if other_spirits > 0:
                card.current_cores += other_spirits
                lvl, bp = calculate_bp_and_level(card.levels, card.current_cores)
                card.current_level = lvl
                card.current_bp = bp
                self.logs.append(f"👑 [KINGTAURUS SUMMON]: Channeled {other_spirits} other spirits! +{other_spirits} Cores from Void -> Elevated to Lv{lvl}, {bp} BP!")

        # 2. Fixed Cores from Void to Spirit (e.g. Biollante)
        elif 'cores from the void to this spirit' in eff:
            m = re.search(r'put\s+(\d+|one|two|three)\s+cores?\s+from\s+the\s+void\s+to\s+this\s+spirit', eff)
            cnt = 2 if m and 'two' in m.group(0) else 1
            card.current_cores += cnt
            lvl, bp = calculate_bp_and_level(card.levels, card.current_cores)
            card.current_level = lvl
            card.current_bp = bp

        # 3. Fixed Cores to Reserve
        elif 'from the void to your reserve' in eff:
            player.reserve += 1

        # 4. Draw Cards on Summon
        elif 'draw' in eff and 'cards' in eff:
            cnt = 2 if 'two' in eff else 1
            for _ in range(cnt):
                if player.deck:
                    player.hand.append(player.deck.pop(0))

        # 5. Destroy opposing spirit <= X BP
        elif 'destroy an opposing' in eff and 'bp or less spirit' in eff:
            m = re.search(r'destroy an opposing\s+(\d+)\s*bp or less spirit', eff)
            if m:
                max_bp = int(m.group(1))
                eligible = [s for s in opp.field if s.current_bp <= max_bp]
                if eligible:
                    eligible.sort(key=lambda s: s.current_bp, reverse=True)
                    target = eligible[0]
                    opp.field.remove(target)
                    opp.reserve += target.current_cores
                    opp.trash += 1
                    self.logs.append(f"Turn {self.turn}: {card.name} destroyed opposing '{target.name}' ({target.current_bp} BP) on summon!")

    def _execute_attack_step(self, player: SimulationPlayer, opp: SimulationPlayer):
        """Simulates attack step with Expectimax combat evaluations and BP comparisons."""
        while True:
            ready_attackers = [s for s in player.field if not s.is_exhausted and not s.has_attacked]
            if not ready_attackers:
                break

            # Expectimax Evaluation: Find highest expected value attacker
            best_attacker = None
            best_ev = -999999

            for att in ready_attackers:
                ev = self._evaluate_attack_action(att, player, opp)
                if ev > best_ev and ev >= player.profile.get("aggro_threshold", 0.4):
                    best_ev = ev
                    best_attacker = att

            if not best_attacker:
                break # Holding back is optimal

            # Declare Attack
            best_attacker.is_exhausted = True
            best_attacker.has_attacked = True
            att_bp = best_attacker.current_bp

            # Check (When Attacks) BP boost
            if '(when attacks)' in best_attacker.effect.lower():
                m = re.search(r'gains\s*\+(\d+)\s*bp', best_attacker.effect.lower())
                if m:
                    att_bp += int(m.group(1))

            # Opponent Block Decision
            ready_blockers = [s for s in opp.field if not s.is_exhausted]
            chosen_blocker = None

            if ready_blockers:
                # Can blocker win combat?
                winning_blockers = [b for b in ready_blockers if b.current_bp > att_bp]
                if winning_blockers:
                    winning_blockers.sort(key=lambda b: b.current_bp)
                    chosen_blocker = winning_blockers[0]
                elif opp.life <= 1: # Must block to avoid losing game
                    ready_blockers.sort(key=lambda b: b.current_bp, reverse=True)
                    chosen_blocker = ready_blockers[0]
                elif random.random() < 0.25 and ready_blockers:
                    # Occasional chump block
                    ready_blockers.sort(key=lambda b: b.current_bp)
                    chosen_blocker = ready_blockers[0]

            if chosen_blocker:
                # Combat Clash
                chosen_blocker.is_exhausted = True
                blk_bp = chosen_blocker.current_bp

                if att_bp > blk_bp:
                    # Attacker Wins! Opponent blocker destroyed
                    opp.field.remove(chosen_blocker)
                    opp.reserve += chosen_blocker.current_cores
                    opp.trash += 1
                    self.logs.append(f"Turn {self.turn}: {best_attacker.name} ({att_bp} BP) destroyed {chosen_blocker.name} ({blk_bp} BP) in combat!")

                    # BP COMPARISON TRIGGER (The Duke Kingtaurus Life Burn)
                    self._check_bp_comparison_trigger(best_attacker, player, opp)

                elif blk_bp > att_bp:
                    # Blocker Wins! Attacker destroyed
                    player.field.remove(best_attacker)
                    player.reserve += best_attacker.current_cores
                    player.trash += 1
                    self.logs.append(f"Turn {self.turn}: Blocker {chosen_blocker.name} defeated attacker {best_attacker.name}!")
                else:
                    # Mutual Destruction
                    player.field.remove(best_attacker)
                    player.reserve += best_attacker.current_cores
                    player.trash += 1
                    opp.field.remove(chosen_blocker)
                    opp.reserve += chosen_blocker.current_cores
                    opp.trash += 1
            else:
                # Direct Hit to Opponent Life
                opp.life = max(0, opp.life - 1)
                opp.reserve += 1
                self.logs.append(f"Turn {self.turn}: {best_attacker.name} inflicted DIRECT HIT! Opponent life: {opp.life}")

                # Check Burst trigger
                if opp.burst and opp.life > 0:
                    self._trigger_burst(opp, player)

            if self._check_game_over():
                return

    def _check_bp_comparison_trigger(self, attacker: SimulationCard, player: SimulationPlayer, opp: SimulationPlayer):
        """Checks for BP comparison victory effects (Kingtaurus, Kaiseratlas, Siegfried)."""
        eff = attacker.effect.lower()
        if 'bp comparison' not in eff:
            return

        # 1. The Duke Kingtaurus: Send 1 opposing Life to Reserve
        if 'send an opposing life to their reserve' in eff:
            # Check Level 2+ requirement
            if attacker.current_level >= 2:
                if opp.life > 0:
                    opp.life = max(0, opp.life - 1)
                    opp.reserve += 1
                    self.logs.append(f"👑💥 [KINGTAURUS BP VICTORY]: 'Gae Bolg' pierced defense! 1 Opposing Life -> Reserve (Remaining: {opp.life})")

    def _trigger_burst(self, player: SimulationPlayer, opp: SimulationPlayer):
        """Resolves Burst card when life is reduced."""
        burst_card = player.burst
        player.burst = None
        if not burst_card:
            return
        if burst_card.type == 'Spirit':
            lvl, bp = calculate_bp_and_level(burst_card.levels, 1)
            burst_card.current_cores = 1
            burst_card.current_level = lvl
            burst_card.current_bp = bp
            burst_card.is_exhausted = False
            player.field.append(burst_card)
            self.logs.append(f"Turn {self.turn}: {player.name} activated BURST SUMMON: '{burst_card.name}'!")
            self._trigger_when_summoned(burst_card, player, opp)
        elif burst_card.type == 'Magic':
            player.trash += 1
            # If defensive aura or draw
            if 'draw' in burst_card.effect.lower():
                for _ in range(2):
                    if player.deck:
                        player.hand.append(player.deck.pop(0))

    def _evaluate_attack_action(self, attacker: SimulationCard, player: SimulationPlayer, opp: SimulationPlayer) -> float:
        """Expectimax evaluation of declaring an attack with `attacker`."""
        att_bp = attacker.current_bp
        ready_blockers = [s for s in opp.field if not s.is_exhausted]

        if not ready_blockers:
            # Guaranteed Direct Hit! High value
            return 1.5 * player.profile["w_life"]

        # Probability opponent can cleanly destroy attacker
        threats = [b for b in ready_blockers if b.current_bp > att_bp]
        if threats:
            # Threat exists: is attacker expendable or is it a boss?
            if attacker.cost >= 7:
                return -2.0 # Protect boss
            return -0.5 # Weak spirit sacrifice for chip damage

        # Attacker dominates all ready blockers!
        favorable_trades = [b for b in ready_blockers if b.current_bp < att_bp]
        if favorable_trades:
            score = 1.0 + (att_bp / 5000.0)
            if 'kingtaurus' in attacker.name.lower() and attacker.current_level >= 2:
                score += 2.5 # Huge reward for Kingtaurus BP burn!
            return score

        return 0.5

    def _check_game_over(self) -> bool:
        if self.p1.life <= 0:
            self.winner = self.p2
            return True
        if self.p2.life <= 0:
            self.winner = self.p1
            return True
        return False


# ── TOURNAMENT & SELF-PLAY TRAINING ENGINE ──
class MonteCarloAiTrainer:
    """Runs automated tournament matches between archetype AI profiles and tunes weights."""
    def __init__(self, profiles: Dict[str, Dict[str, Any]] = None):
        self.profiles = copy.deepcopy(profiles or DEFAULT_ARCHETYPE_PROFILES)
        self.decks_cache = {}
        for color in self.profiles.keys():
            d = standard_decks.get_standard_deck(color)
            if d:
                # Expand validated cards by count
                cards = []
                for c in d.get('validated_cards', []):
                    for _ in range(c.get('count', 1)):
                        cards.append(copy.deepcopy(c))
                self.decks_cache[color] = cards

    def run_matchup(self, color1: str, color2: str) -> Tuple[str, int]:
        """Plays 1 match between two color deck archetypes."""
        cards1 = copy.deepcopy(self.decks_cache[color1])
        cards2 = copy.deepcopy(self.decks_cache[color2])

        p1 = SimulationPlayer(f"{color1.upper()}_AI", cards1, self.profiles[color1])
        p2 = SimulationPlayer(f"{color2.upper()}_AI", cards2, self.profiles[color2])

        sim = BattleSpiritsSimEngine(p1, p2)
        winner, turns, _ = sim.run_match()

        win_color = color1 if winner == p1 else color2
        return win_color, turns

    def run_tournament(self, matches_per_pair: int = 10) -> Dict[str, Any]:
        """Runs a round-robin tournament across all archetype profiles."""
        colors = list(self.profiles.keys())
        wins = {c: 0 for c in colors}
        matches_played = {c: 0 for c in colors}

        for i in range(len(colors)):
            for j in range(i + 1, len(colors)):
                c1, c2 = colors[i], colors[j]
                for _ in range(matches_per_pair):
                    w, _ = self.run_matchup(c1, c2)
                    wins[w] += 1
                    matches_played[c1] += 1
                    matches_played[c2] += 1

        win_rates = {
            c: round(wins[c] / max(1, matches_played[c]) * 100, 1)
            for c in colors
        }
        return {"wins": wins, "matches": matches_played, "win_rates": win_rates}

    def train_evolutionary(self, generations: int = 3, matches_per_gen: int = 6) -> Dict[str, Any]:
        """
        Genetic / Evolutionary parameter tuning:
        Perturbs weights slightly, evaluates win rates, and keeps improvements.
        """
        print(f"\n[TRAIN] Commencing Evolutionary AI Training ({generations} Generations, {matches_per_gen} matches/pair)...")
        best_overall_wr = 0

        for gen in range(1, generations + 1):
            print(f"\n--- Generation {gen}/{generations} ---")
            # Evaluate current performance
            res = self.run_tournament(matches_per_gen)
            for c, wr in res["win_rates"].items():
                print(f"  {c.upper():<7}: {wr}% win rate ({res['wins'][c]}/{res['matches'][c]} wins)")

            # Mutation step: slightly adjust weights toward optimal performance
            for color, p in self.profiles.items():
                wr = res["win_rates"][color]
                if wr < 50.0:
                    # Underperforming: adapt weights
                    p["w_field_bp"] = round(p["w_field_bp"] * random.uniform(0.95, 1.15), 2)
                    p["w_life"] = round(p["w_life"] * random.uniform(0.95, 1.15), 2)
                    p["w_core_advantage"] = round(p["w_core_advantage"] * random.uniform(0.95, 1.2), 2)
                    p["aggro_threshold"] = round(max(0.2, min(0.7, p["aggro_threshold"] + random.uniform(-0.05, 0.05))), 2)

        return self.profiles

    def save_profiles(self, filepath: str = 'ai_weights.json'):
        """Saves trained profiles to disk for battle_arena.js and server.py."""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.profiles, f, indent=2)
        print(f"\n[OK] Successfully saved trained AI profiles to '{filepath}'!")


if __name__ == '__main__':
    import sys
    trainer = MonteCarloAiTrainer()

    if '--test-kingtaurus' in sys.argv:
        # Verify Kingtaurus simulation in isolation
        print("Testing Kingtaurus in Headless Simulation...")
        cards_green = copy.deepcopy(trainer.decks_cache['green'])
        cards_red = copy.deepcopy(trainer.decks_cache['red'])
        p1 = SimulationPlayer("GREEN_KINGTAURUS", cards_green, trainer.profiles['green'])
        p2 = SimulationPlayer("RED_OPPONENT", cards_red, trainer.profiles['red'])
        sim = BattleSpiritsSimEngine(p1, p2)
        winner, turns, logs = sim.run_match()
        print(f"Match ended in Turn {turns}. Winner: {winner.name if winner else 'Draw'}")
        kt_logs = [l for l in logs if 'KINGTAURUS' in l]
        print(f"Kingtaurus trigger events during match: {len(kt_logs)}")
        for l in kt_logs[:5]:
            print("  ", l)

    else:
        # Run training loop & tournament
        print("--- RUNNING BATTLE SPIRITS AI TRAINING & TOURNAMENT ---")
        trainer.train_evolutionary(generations=3, matches_per_gen=6)
        trainer.save_profiles('ai_weights.json')
