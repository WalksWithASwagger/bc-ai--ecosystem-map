#!/usr/bin/env python3
"""
Cross-reference script to compare research organizations against Notion database
"""

# Organizations from research
research_orgs = {
    # Vancouver Island
    "Certn": "Vancouver Island",
    "Pani Energy": "Vancouver Island", 
    "Niricson": "Vancouver Island",
    "MarineLabs": "Vancouver Island",
    
    # Lower Mainland
    "AbCellera": "Lower Mainland",
    "Variational AI": "Lower Mainland",
    "Sanctuary AI": "Lower Mainland",
    "MetaOptima": "Lower Mainland",  # Note: database shows "MetaOptima" (may be same as DermEngine)
    "Responsive AI": "Lower Mainland",
    "Klue": "Lower Mainland",
    "VRIFY Technology": "Lower Mainland",
    "Penny AI": "Lower Mainland",
    "Charli AI": "Lower Mainland",
    "Apera AI": "Lower Mainland",
    "Lumen5": "Lower Mainland",
    "Levr.ai": "Lower Mainland",
    "Quandri": "Lower Mainland",
    "Inverted AI": "Lower Mainland",
    
    # Okanagan
    "TerraSense Analytics": "Okanagan",
    "CRWN.ai": "Okanagan",
    "Two Hat Security": "Okanagan",
    "Genesis AI Corp": "Okanagan"
}

# Organizations currently in Notion database (from API query)
current_db_orgs = [
    "1QBit", "221A Node Library", "3DentAI", "ASC Creative Ltd.", "AbCellera",
    "Absolute Software Vancouver", "Active Impact Investments", "Adastra Corporation",
    "AltaML (Vancouver)", "Altitude Business Intelligence", "Amplitude Ventures",
    "Animikii", "Artemis", "Auryon.ai", "Axiom Zen", "BLUESENSE AI", "Bayes Studio",
    "BetterTable", "Brightspark Ventures", "Canada Techs", "Certn",
    "Cisco Systems (Vancouver)", "Clir Renewables", "Creative Destruction Lab Vancouver (CDL)",
    "D-Wave Systems", "Deloitte Omnia AI", "Dooly.ai", "EarthDaily Analytics", "Ekohe",
    "Finger Food Advanced Technology Group", "Finn.ai", "First Nations Technology Council (FNTC)",
    "Fobi AI", "Genesis AI", "Google Vancouver", "Google for Startups Accelerator: AI for Nature",
    "Hootsuite", "IBM Vancouver", "Inoxoft", "IntLabs", "Inverted AI", "Jetson",
    "Kai Analytics International", "Kensington Capital Partners", "Klue", "Lumen5",
    "Meta Vancouver", "MetaOptima", "Microsoft Research Asia Vancouver", "Microsoft Vancouver",
    "Mind AI & Consciousness", "MineSense", "Novarc Technologies", "OnDeck Fisheries AI",
    "OneFeather", "Orishnal Digital Services", "Pender Ventures", "Picovoice", "Pieoneers",
    "Planview (Vancouver)", "Providence Health & IBM Centre for Heart Lung Innovation",
    "QueerTech QT Founders Catalyst Program", "RBC Borealis AI (Vancouver Lab)",
    "Raven Indigenous Capital Partners", "Responsive AI", "SAP Canada (Vancouver)",
    "SFU Computing Science & Creative AI Labs", "SFU's Digital Democracies Institute",
    "SenseNet", "Silo AI Vancouver", "Softmax Data Inc.", "Squamish AI (Stawamus Syntax)",
    "Surrey AI", "TELUS - Data & AI Initiatives", "TELUS", "Teck Resources & AltaML Applied AI Lab",
    "Terramera", "The Number", "ThinkLabs AI", "Two Hat Security", "UBC CAIDA Center",
    "UBC Centre for AI Decision-making and Action (CAIDA)", "UBC Master of Data Science (MDS)",
    "Unity Technologies (Vancouver)", "University of Victoria (UVic) AI Research",
    "VIATEC AI Meetups", "Vancouver Angel Network (VANTEC)", "Vancouver Tech Journal",
    "Vanedge Capital", "Variational AI", "Victoria Data Society", "Visier",
    "Voronoi Health Analytics", "Weir Motion Metrics", "WildlifeAI", "Wizard Labs",
    "Womxn's AI (Vancouver)", "Zfort Group", "deltAlyz Canada"
]

def analyze_cross_reference():
    """Analyze which organizations are already in DB vs missing"""
    
    # Convert to sets for easier comparison
    research_names = set(research_orgs.keys())
    db_names = set(current_db_orgs)
    
    # Find matches (exact name matches)
    exact_matches = research_names.intersection(db_names)
    
    # Find potential partial matches (case insensitive, substring matching)
    potential_matches = {}
    missing_orgs = research_names - exact_matches
    
    for missing_org in missing_orgs:
        for db_org in db_names:
            # Check for partial matches
            if (missing_org.lower() in db_org.lower() or 
                db_org.lower() in missing_org.lower() or
                # Check for common variations
                missing_org.replace(" ", "").lower() == db_org.replace(" ", "").lower()):
                potential_matches[missing_org] = db_org
                break
    
    # Organizations that are definitely missing
    truly_missing = missing_orgs - set(potential_matches.keys())
    
    print("=== CROSS-REFERENCE ANALYSIS ===\n")
    
    print(f"EXACT MATCHES FOUND ({len(exact_matches)}):")
    for org in sorted(exact_matches):
        region = research_orgs[org]
        print(f"  ✓ {org} ({region})")
    
    print(f"\nPOTENTIAL MATCHES FOUND ({len(potential_matches)}):")
    for research_org, db_org in sorted(potential_matches.items()):
        region = research_orgs[research_org]
        print(f"  ? {research_org} -> {db_org} ({region})")
    
    print(f"\nMISSING ORGANIZATIONS ({len(truly_missing)}):")
    for org in sorted(truly_missing):
        region = research_orgs[org]
        print(f"  ✗ {org} ({region})")
    
    print(f"\n=== SUMMARY ===")
    print(f"Total research organizations: {len(research_names)}")
    print(f"Exact matches: {len(exact_matches)}")
    print(f"Potential matches: {len(potential_matches)}")
    print(f"Missing organizations: {len(truly_missing)}")
    print(f"Organizations already in database: {len(exact_matches) + len(potential_matches)}")
    print(f"New organizations to add: {len(truly_missing)}")
    
    # Detailed breakdown by region
    print(f"\n=== REGIONAL BREAKDOWN ===")
    regions = {"Vancouver Island": [], "Lower Mainland": [], "Okanagan": []}
    
    for org in truly_missing:
        region = research_orgs[org]
        regions[region].append(org)
    
    for region, orgs in regions.items():
        if orgs:
            print(f"\n{region} - Missing ({len(orgs)}):")
            for org in sorted(orgs):
                print(f"  • {org}")
    
    return {
        'exact_matches': exact_matches,
        'potential_matches': potential_matches,
        'missing_orgs': truly_missing
    }

if __name__ == "__main__":
    results = analyze_cross_reference()