const { batchAddOrganizations } = require('./batch-add-orgs');

const regionalOrgs = [
  // From discovery-scout-regional.md
  { name: "Audette.io", category: "Startup", city: "Victoria", region: "Vancouver Island" },
  { name: "Echosec Systems", category: "Startup", city: "Victoria", region: "Vancouver Island" },
  { name: "Barnacle Systems", category: "Startup", city: "Victoria", region: "Vancouver Island" },
  { name: "Flytographer", category: "Startup", city: "Victoria", region: "Vancouver Island" },
  { name: "UVic AI and Machine Learning Lab", category: "Academic & Research Labs", city: "Victoria", region: "Vancouver Island" },
  { name: "QHR Technologies", category: "Enterprise / Corporate Divisions", city: "Kelowna", region: "Interior" },
  { name: "FreshGrade", category: "Startup", city: "Kelowna", region: "Interior" },
  { name: "Disney Interactive Studios Kelowna", category: "Enterprise / Corporate Divisions", city: "Kelowna", region: "Interior" },
  { name: "Yeti Farm Creative", category: "Service Studios / Agencies", city: "Kelowna", region: "Interior" },
  { name: "FNHA Digital Health Division", category: "Indigenous Tech & Creative Orgs", city: "Vancouver", region: "Lower Mainland" },
  { name: "Indigenous Digital Equity Strategy BC", category: "Indigenous Tech & Creative Orgs", city: "Vancouver", region: "Lower Mainland" },
  { name: "Nirvanic Consciousness Technologies", category: "Startup", city: "Vancouver", region: "Lower Mainland" },
  { name: "Quantum BC", category: "Industry Association", city: "Vancouver", region: "Lower Mainland" },
  { name: "Quantum Matter Institute", category: "Academic & Research Labs", city: "Vancouver", region: "Lower Mainland" },
  { name: "SFU Quantum Fabrication Centre", category: "Academic & Research Labs", city: "Burnaby", region: "Lower Mainland" },
  { name: "TRU Computer Science Department", category: "Academic & Research Labs", city: "Kamloops", region: "Interior" },
  { name: "Northern Development Initiative Trust", category: "Government", city: "Prince George", region: "Northern BC" },
  { name: "UNBC Computer Science Department", category: "Academic & Research Labs", city: "Prince George", region: "Northern BC" },
  { name: "Tkmlps Development Corporation", category: "Indigenous Tech & Creative Orgs", city: "Kamloops", region: "Interior" },
  { name: "AQC 2025 Vancouver", category: "Non-Profit", city: "Vancouver", region: "Lower Mainland" }
];

console.log(`\n🌍 Adding ${regionalOrgs.length} regional organizations...\n`);
batchAddOrganizations(regionalOrgs);