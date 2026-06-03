# Variant: Branded / NZ Trades

## Design stance
Dark, premium-feel tool that looks like a proper app — not a web form. Category colours give each tool type a visual identity. Subtle glow and frosted glass header add polish without getting in the way.

## Key choices
- **Colour:** Deep background (#0a0a0f), amber primary (#f59e0b), electric cyan secondary (#06b6d4), with category colours (green for checklists, purple for search, rose for EV)
- **Typography:** System font stack, tighter letter-spacing on headings
- **Cards:** 14px radius, subtle border, 1px distinction between layers
- **Left accent bar:** Each module button gets a coloured left border (cyan=calc, green=checklist, amber=ref, purple=search)
- **Icons:** Tool-typed icon backgrounds with matching colour tint
- **Search results:** Colour-coded category badges with dots, better readability
- **Header:** Frosted glass (backdrop-filter blur), gradient logo mark with glow
- **Badges:** "NZ" badge on EV charger, "172" counter badge on search

## Colour system
| Role | Hex | Usage |
|------|-----|-------|
| Background | #0a0a0f | Deeper, more premium |
| Card | #12121a | Slightly lighter than bg |
| Amber | #f59e0b | Primary accent, header badge |
| Cyan | #06b6d4 | Calculators, cable sizing |
| Green | #10b981 | Checklists, earthing |
| Purple | #8b5cf6 | Search |
| Rose | #f43f5e | EV charging |

## Trade-offs
- **Strong at:** Feels like a real app, easy to scan by colour, premium aesthetic
- **Weak at:** Heavier CSS (more gradients, transitions, glows)
- **Overhead:** Colour system needs maintaining if new tool types added

## Best for
NZ electricians using it daily on-site — makes the tool feel professional and trustworthy, not like a quick side project.
