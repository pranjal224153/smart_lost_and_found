require('dotenv').config();
const mongoose = require('mongoose');
const Item = require('./models/Item');
const Match = require('./models/Match');
const Notification = require('./models/Notification');
const mlClient = require('./utils/mlClient');

async function triggerMatching(newItem, candidates) {
  if (candidates.length === 0) return 0;

  console.log(`Comparing item "${newItem.title}" with ${candidates.length} candidates...`);
  
  try {
    const matchResults = await mlClient.findMatches(newItem, candidates);

    if (!matchResults || matchResults.length === 0) {
      console.log('No matches found for this item.');
      return 0;
    }

    let matchCount = 0;
    for (const result of matchResults) {
      if (result.combined_score < 0.50) continue;

      const lostItem = newItem.type === 'lost' ? newItem._id : result.candidate_id;
      const foundItem = newItem.type === 'found' ? newItem._id : result.candidate_id;

      try {
        const match = await Match.findOneAndUpdate(
          { lostItem, foundItem },
          {
            lostItem,
            foundItem,
            textScore: result.text_score || 0,
            imageScore: result.image_score || 0,
            combinedScore: result.combined_score || 0,
          },
          { upsert: true, new: true }
        );

        const candidateItem = candidates.find(c => c._id.toString() === result.candidate_id);
        if (candidateItem) {
          matchCount++;
          console.log(`  - Match found with "${candidateItem.title}" (Score: ${Math.round(result.combined_score * 100)}%)`);
        }
      } catch (err) {
        if (err.code !== 11000) console.error('Match save error:', err);
      }
    }
    return matchCount;
  } catch (error) {
    console.error('Error in findMatches:', error.message);
    return 0;
  }
}

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-lost-found';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const items = await Item.find({});
    console.log(`Found ${items.length} items in total.`);
    items.forEach(it => console.log(` - [${it.type}] ${it.title} (Status: ${it.status}, Category: ${it.category})`));

    let totalMatches = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const oppositeType = item.type === 'lost' ? 'found' : 'lost';
      
      const candidates = await Item.find({
        type: oppositeType,
        _id: { $ne: item._id }
      });

      if (candidates.length > 0) {
        const count = await triggerMatching(item, candidates);
        totalMatches += count;
      }
    }

    console.log(`\nMatching completed. Total new/updated matches: ${totalMatches}`);
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

run();
