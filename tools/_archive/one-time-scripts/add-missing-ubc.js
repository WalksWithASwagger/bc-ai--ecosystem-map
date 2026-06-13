const { addOrganization } = require('./batch-add-orgs');

const missingOrg = {
  name: "entrepreneurship@UBC Accelerate",
  category: "Accelerators / Incubators",
  city: "Vancouver",
  region: "Lower Mainland"
};

console.log(`\n🚀 Adding missing organization: ${missingOrg.name}\n`);

addOrganization(missingOrg)
  .then(result => {
    if (result) {
      console.log(`\n✅ Successfully added: ${missingOrg.name}`);
    } else {
      console.log(`\n❌ Failed to add: ${missingOrg.name}`);
    }
  })
  .catch(error => {
    console.error('Error:', error.message);
  });