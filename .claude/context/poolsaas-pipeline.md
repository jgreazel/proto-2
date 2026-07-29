# PoolSaaS Operational Action Plan & Pipeline

## High-Integrity Communication Playbooks

### 1. The Regional Neighborly Outreach (August Peak Pain)

_Use via email or LinkedIn messaging targeting Parks & Rec Directors or City Clerks within an hour or two radius of Altoona/Audubon._

```text
Subject: Simplifying pool operations - Audubon reference

Hey [Name],

I’m a software engineer down in Altoona. This past year, I've been working with the team over in Audubon to help clean up their summer pool operations. Before we set this up, they were dealing with typical headaches—tracking teen lifeguard hours on paper logs, missing concession counts, and messy cash drawers at closing. We built a simple digital dashboard that centralized their gate passes and time clocks so the city office had a clean audit trail at the end of the month.

I’m looking to see if other regional pools face those same tracking bottlenecks or if Audubon was an isolated case. If you're open to it, I'd love to send over a 2-minute video of how they use it just to see if it's something that would make your department's bookkeeping easier next season.
```

### 2. Handling Competitive Systems Honestly (The "Honest Engineer" Judo)

_How to handle mentions of legacy platforms (RecDesk, CivicRec, MyRec) without doing competitor research._

```text
"I'm actually not super familiar with [Competitor's] specific interface—I built this custom because the communities I talked to felt those massive, one-size-fits-all platforms were too bloated, expensive, and hard for seasonal teen staff to navigate quickly.

Our focus was entirely on making the simplest, fastest tool possible for live pool-side workflows like tracking concessions and shift check-ins in 90-degree heat. Out of curiosity, what features in your current system are the most critical to your team's workflow?"
```

### 3. The Follow-Up Sequence (Where Replies Actually Come From)

_One-and-done is the real ignore risk — not a missing "can we meet?" ask. Never put a call or meeting request in email #1; it raises the commitment cost and kills reply rate. The video CTA is already the lowest-friction ask available._

**Day 0 — Send Playbook #1 verbatim. Do not edit or polish it.**

**Day 6 — The Bump.** Reply in the same thread (keeps it threaded, no new subject):

```text
Hey [Name],

Bumping this in case it got buried — totally understand if pool ops aren't
top of mind right now.

Short version: I'd just like to know whether paper lifeguard logs and cash
drawer reconciliation are a headache for you too, or if Audubon was unusual.
One sentence either way is genuinely useful to me.
```

**Day 13 — The Close-the-Loop.** Highest-reply-rate message in most sequences. Same thread:

```text
Hey [Name],

Last one from me — I'll assume this isn't a fit and stop cluttering your inbox.

If it turns out gate counts or lifeguard hours become a pain point during your
off-season review this fall, I'm easy to find. Good luck wrapping up the season.
```

**Day 14 — Phone fallback, 10 minutes max, only if no reply to all three.** Municipal staff answer their phones; this is a legitimate touch, not networking. Do NOT cold-call before the email sequence has run — the email is what makes the call warm.

```text
"Hi [Name], this is Jon Greazel — I'm a software engineer over in Altoona. I sent
a couple emails about the pool operations dashboard we built for Audubon. Not
trying to sell you anything on this call, I'm honestly just trying to find out
whether the paper-log and cash-drawer stuff is a real headache for you too, or
whether Audubon was a one-off. Do you have 60 seconds?"
```

**Escalation rule:** if Chad (Carroll) goes silent through Day 14, restart the sequence at Day 0 with Jack Wardell, the Recreation Superintendent. He is likelier to own the day-to-day operational pain.

**Time cost of the full sequence:** ~15 min per town, spread across two weeks. Fits the async constraint.

---

## Active Target Pipeline

| Town                 | Population | Target Persona                          | Contact                                              | Contact Status | Notes                                                       |
| :------------------- | :--------- | :-------------------------------------- | :--------------------------------------------------- | :------------- | :---------------------------------------------------------- |
| **Carroll, IA**      | ~10,000    | Chad Tiemeyer (Director of Parks & Rec) | ctiemeyer@cityofcarroll.com · 712-792-1000 x510      | Not Started    | Top tier regional hub. High priority target. Fallback: Jack Wardell, Recreation Superintendent — jwardell@cityofcarroll.com · 712-792-5400 x276. |
| **Atlantic, IA**     | ~6,500     | Maggie Robinson (Parks & Rec Director)  | mrobinson@cityofatlantic.com · 712-243-3542          | Not Started    | Great size match, close geographic peer to Audubon. 1200 Sunnyside Lane, Atlantic, IA 50022. |
| **Harlan, IA**       | ~4,800     | City Clerk / Parks Board Lead           | Not Started    | Direct neighbor to Audubon; high word-of-mouth leverage.    |
| **Atlantic/Denison** | ~8,000     | Parks & Rec Lead                        | Not Started    | Active regional pool footprint.                             |
| **Guthrie Center**   | ~1,500     | City Clerk                              | Not Started    | Small tier, target Clerk directly for shared pain analysis. |
| **Jefferson, IA**    | ~4,100     | Parks Board Lead / Clerk                | Not Started    | Solid fit for mid-tier utility wrapper approach.            |

---

## Immediate Next Steps for Next Session

1. **Maintain Engineering Freeze:** Do not write code for multi-tenancy or billing engines. Leave infrastructure exactly as it is.
2. **Execute Pipeline Drop:** In early August, locate the exact email addresses for Chad (Carroll) and Maggie (Atlantic) on their respective municipal sites and drop them into this log.
3. **Draft the 2-Minute Video Script:** Record a raw, unedited walkthrough screen-share of the Audubon dashboard focusing on the shift clock and gate reconciliation—no polish, pure functionality.
