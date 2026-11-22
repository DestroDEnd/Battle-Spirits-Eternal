import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/namis/.gemini/antigravity/brain/59963aa5-f4ab-4775-8bd0-a8eb0fc80c92/.system_generated/logs/transcript_full.jsonl')
});

rl.on('line', (line) => {
  if (line.includes('"step_index":9559')) {
    const obj = JSON.parse(line);
    fs.writeFileSync('scripts/prompt_9559.txt', obj.content, 'utf8');
    console.log('Written prompt successfully!');
    process.exit(0);
  }
});
