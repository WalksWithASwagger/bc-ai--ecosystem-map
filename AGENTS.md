# AGENTS.md

how to work in this repo, for humans and their agents.

## what this is
a living, searchable map of British Columbia's AI ecosystem: orgs, labs, research groups, and community projects, filterable by region, sector, and tech focus. Notion-backed data, Next.js front end.

## ground rules
- match the existing style. surgical changes only. don't restructure adjacent code that isn't part of your task.
- public copy follows the house voice: see kk-brand/VOICE.md. full punk, no em dashes.
- secrets stay out of source. the Notion tooling reads NOTION_TOKEN and NOTION_DATABASE_ID from the environment. never hard-code a token in a file, example, or commit.
- this is community data about real people and real orgs. correct records, don't invent them. cite the source when you add or change a field.
- don't promise a hosted demo. there isn't one yet. if that changes, update the README and llms.txt together.
- numbers are claims, not gospel. the org count and coverage figures are maintainer self-reported and dated. re-verify against the live database before repeating them in new copy.

## where things live
- `ui/`: Next.js front end for browsing the map
- `tools/`: data enhancement and analysis scripts (run via npm, e.g. `npm run analyze -- --help`)
- `CONTRIBUTING.md`: how to add an org or fix a record

## the maker
Kris Krüg (@WalksWithASwagger) · https://kriskrug.co · BC + AI
