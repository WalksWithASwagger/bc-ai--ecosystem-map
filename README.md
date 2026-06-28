```text
~~~ K R Ü G ~~~  ecosystem map
the future belongs to the weird
```

# bc-ai--ecosystem-map

`a living map of who's actually doing AI in British Columbia, and where to find them`

this is the BC + AI ecosystem map. the companies, the labs, the research groups, the Indigenous-led projects, the weirdos in a garage in Kamloops. all of it on one searchable map you can filter by region, by sector, by what kind of AI they actually do. the point is simple: make it stupid easy to find the people already in this work so you can go build something with them.

we keep it because nobody else was. the province's AI scene doesn't live in one VC's spreadsheet or one government slide deck. it lives across the whole map, Vancouver to Prince Rupert, and it kept getting flattened to "Vancouver tech" or left off the list entirely. so we mapped it ourselves. it's for founders looking for collaborators, researchers looking for peers, funders who keep funding the same four names, and anyone who's been told they're not part of "the ecosystem" and wants the receipts.

## what it does

- search the province by region, sector, or tech focus and find collaborators fast
- one record per org: who they are, where they are, what kind of AI they do
- backed by a Notion database so the community can correct and add to it, not just read it
- covers all the major BC regions, not just the Lower Mainland
- ships a Next.js front end in `ui/` for browsing the map
- open data for the whole community: researchers, policymakers, founders, organizers

## start here

there's no hosted version yet. you run it from a checkout.

needs Node and a Notion token. the database tools read and write a Notion workspace, so set your secrets first, never commit them.

```bash
git clone https://github.com/WalksWithASwagger/bc-ai--ecosystem-map.git
cd bc-ai--ecosystem-map
npm install

export NOTION_TOKEN=secret_xxx
export NOTION_DATABASE_ID=your_database_id

npm run analyze -- --help   # see what the database tooling can do
```

front end lives in `ui/` (Next.js). data enhancement and analysis scripts live in `tools/`. see `CONTRIBUTING.md` to add an org or fix a record.

## these repos run on agents

built to be operated by humans and machines. see `AGENTS.md` and `llms.txt`.

---
> i build bridges where human creativity and machine intelligence collide.

made by Kris Krüg · [@WalksWithASwagger](https://github.com/WalksWithASwagger) · [bc-ai.ca](https://bc-ai.ca) · [kriskrug.co](https://kriskrug.co)
