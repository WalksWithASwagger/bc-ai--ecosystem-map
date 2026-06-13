const fs = require('fs');
const path = require('path');

// LinkedIn URLs found in the markdown files
const linkedinData = [
  { name: "Meton.ai", linkedin: "https://ca.linkedin.com/company/meton-ai" },
  { name: "CamDo Solutions", linkedin: "https://ca.linkedin.com/company/camdo-solutions-inc-" },
  { name: "Lumen5", linkedin: "https://ca.linkedin.com/company/lumen5" },
  { name: "MetaOptima", linkedin: "https://www.linkedin.com/company/metaoptima-technology-inc-" },
  { name: "Variational AI", linkedin: "https://ca.linkedin.com/company/variational-ai" },
  { name: "Sanctuary AI", linkedin: "https://ca.linkedin.com/company/sanctuaryai" },
  { name: "AIEX", linkedin: "https://www.linkedin.com/company/aiex-ai" },
  { name: "Bonsai Micro", linkedin: "https://ca.linkedin.com/company/bonsai-micro" },
  { name: "ClearSpark AI", linkedin: "https://ca.linkedin.com/company/clearspark-ai" },
  { name: "MoogleLabs", linkedin: "https://in.linkedin.com/company/mooglelabs" },
  { name: "AI Scout Solutions", linkedin: "https://www.linkedin.com/company/ai-scout" },
  { name: "Open Ocean Robotics", linkedin: "https://ca.linkedin.com/company/open-ocean-robotics" },
  { name: "Terramera", linkedin: "https://ca.linkedin.com/company/terramera-inc-" },
  { name: "Timezyx", linkedin: "https://www.linkedin.com/company/timezyx/" },
  { name: "RIVAL Technologies", linkedin: "https://ca.linkedin.com/company/rival-technologies" },
  { name: "Produce8", linkedin: "https://www.linkedin.com/company/produce8" },
  { name: "Payday", linkedin: "https://www.linkedin.com/company/payday-global" },
  { name: "Visier", linkedin: "https://ca.linkedin.com/company/visier-analytics" },
  { name: "Hootsuite", linkedin: "https://ca.linkedin.com/company/hootsuite" },
  { name: "Vision Critical", linkedin: "https://ca.linkedin.com/company/vision-critical" },
  { name: "Nexus Systems", linkedin: "https://www.linkedin.com/company/nexinc" },
  { name: "Inverted AI", linkedin: "https://ca.linkedin.com/company/invertedai" },
  { name: "Canexia Health", linkedin: "https://ca.linkedin.com/company/imagia-canexiahealth" },
  { name: "Wayve", linkedin: "https://www.linkedin.com/company/wayve-technologies" },
  { name: "Persistent Systems", linkedin: "https://ca.linkedin.com/company/persistent-systems" },
  { name: "Mobcoder", linkedin: "https://www.linkedin.com/company/mobcoder-inc" },
  { name: "Simform", linkedin: "https://www.linkedin.com/company/simform" },
  
  // Additional ones from various files
  { name: "4AG Robotics", linkedin: "https://www.linkedin.com/company/4ag-robotics" },
  { name: "Aspect Biosystems", linkedin: "https://www.linkedin.com/company/aspect-biosystems" },
  { name: "Brightside", linkedin: "https://www.linkedin.com/company/brightside-tech" },
  { name: "Browse AI", linkedin: "https://www.linkedin.com/company/browse-ai" },
  { name: "Finn AI", linkedin: "https://www.linkedin.com/company/finn-ai" },
  { name: "Glance Technologies", linkedin: "https://www.linkedin.com/company/glance-technologies" },
  { name: "MarineLabs", linkedin: "https://www.linkedin.com/company/marinelabs" },
  { name: "Motion Metrics", linkedin: "https://www.linkedin.com/company/motion-metrics" },
  { name: "Picovoice", linkedin: "https://www.linkedin.com/company/picovoice" },
  { name: "Precision OS", linkedin: "https://www.linkedin.com/company/precision-os" },
  { name: "Spare Technologies", linkedin: "https://www.linkedin.com/company/spare-labs" },
  { name: "SparkGeo", linkedin: "https://www.linkedin.com/company/sparkgeo" },
  { name: "SkyHive", linkedin: "https://www.linkedin.com/company/skyhive" },
  { name: "Unity Technologies", linkedin: "https://www.linkedin.com/company/unity-technologies" },
  { name: "Victory Square Technologies", linkedin: "https://www.linkedin.com/company/victory-square-technologies" },
  { name: "WildlifeAI", linkedin: "https://www.linkedin.com/company/wildlifeai" }
];

console.log(`\n📋 Extracted ${linkedinData.length} LinkedIn URLs from markdown files\n`);

// Save to JSON file for use by update script
fs.writeFileSync(
  path.join(__dirname, 'linkedin-updates.json'), 
  JSON.stringify(linkedinData, null, 2)
);

console.log('✅ LinkedIn data saved to linkedin-updates.json');

// Display summary
console.log('\nOrganizations with LinkedIn URLs:');
linkedinData.forEach((org, index) => {
  console.log(`${index + 1}. ${org.name}`);
});

module.exports = linkedinData;