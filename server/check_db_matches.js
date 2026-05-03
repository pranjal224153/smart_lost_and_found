const mongoose = require('mongoose');
const Match = require('./models/Match');
const Item = require('./models/Item');
const User = require('./models/User');
require('dotenv').config();

async function checkMatches() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-lost-found');
  console.log('Connected to DB');

  const matches = await Match.find()
    .populate({
      path: 'lostItem',
      populate: { path: 'user' }
    })
    .populate({
      path: 'foundItem',
      populate: { path: 'user' }
    });

  console.log(`Found ${matches.length} matches:`);
  matches.forEach((m, i) => {
    console.log(`${i+1}. [Score: ${m.combinedScore}]`);
    console.log(`   Lost: "${m.lostItem?.title}" (User: ${m.lostItem?.user?.email})`);
    console.log(`   Found: "${m.foundItem?.title}" (User: ${m.foundItem?.user?.email})`);
    console.log('---');
  });

  process.exit(0);
}

checkMatches();
