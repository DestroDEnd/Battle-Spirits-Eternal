with open('server.py', 'r', encoding='utf-8') as f:
    c = f.read()

is_crlf = '\r\n' in c
nl = '\r\n' if is_crlf else '\n'

# 1. Add GET /api/ai-weights
get_target = "            self.send_json({'cards': cards, 'total': len(cards)})" + nl + "            return"
get_replacement = get_target + nl + nl + """        # 12. GET /api/ai-weights — trained AI archetype weights from Paradoxes simulation
        if path == '/api/ai-weights':
            if os.path.exists('ai_weights.json'):
                with open('ai_weights.json', 'r', encoding='utf-8') as f:
                    self.send_json(json.load(f))
            else:
                import ai_trainer
                self.send_json(ai_trainer.DEFAULT_ARCHETYPE_PROFILES)
            return"""

if is_crlf:
    get_replacement = get_replacement.replace('\n', '\r\n')

if get_target in c:
    c = c.replace(get_target, get_replacement, 1)
    print("Added GET /api/ai-weights!")
else:
    print("Warning: get_target not found!")

# 2. Add POST /api/train-ai
post_target = "            self.send_json({'success': True, 'message': f'Sync started for {category} (up to {limit} cards)'})" + nl + "            return"
post_replacement = post_target + nl + nl + """        # POST /api/train-ai — run on-demand Monte Carlo training generations
        if path == '/api/train-ai':
            generations = min(10, max(1, payload.get('generations', 3)))
            matches = min(20, max(2, payload.get('matches', 4)))
            import ai_trainer
            trainer = ai_trainer.MonteCarloAiTrainer()
            updated_profiles = trainer.train_evolutionary(generations=generations, matches_per_gen=matches)
            trainer.save_profiles('ai_weights.json')
            self.send_json({
                'success': True,
                'generations': generations,
                'profiles': updated_profiles
            })
            return"""

if is_crlf:
    post_replacement = post_replacement.replace('\n', '\r\n')

if post_target in c:
    c = c.replace(post_target, post_replacement, 1)
    print("Added POST /api/train-ai!")
else:
    print("Warning: post_target not found!")

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(c)

print("Saved server.py!")
