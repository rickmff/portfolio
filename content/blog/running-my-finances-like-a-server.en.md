Banner: Quentin Matsys, *The Moneylender and His Wife* (1514), Louvre. Counting money was always a habit, not an event. {{credit:banner}}

I have a VPS running my projects and a SaaS that depends on it. Neither runs on improvisation: there's monitoring, backups and a clear idea of what can go wrong. One day I noticed I had none of that for my own money. So I did the obvious developer thing: I treated my finances as infrastructure.

## Fixed costs are infrastructure

In 1758, Benjamin Franklin summed up a problem every server owner knows: "Beware of little expences; a small leak will sink a great ship." (*The Way to Wealth*).

Rent, bills, subscriptions and tools are what has to stay up every month, like the services on a server. That's where the small leaks live: the annual plan that renewed itself, the tool I tried once, the domain I no longer use. Once a quarter I do with subscriptions what I do with stopped containers: list everything and shut down what I don't use.

## An emergency fund is redundancy

Charles Dickens gave Mr Micawber the most famous budgeting rule in literature: "Annual income twenty pounds, annual expenditure nineteen nineteen and six, result happiness." (*David Copperfield*, 1850).

His next line is the same sum with sixpence more spending, and the result becomes "misery". The difference between the two is tiny. That's why the margin matters.

Nobody ships to production without backups, and an emergency fund is life's backup. If you're self-employed or live on project income, it lets you turn down a bad gig or get through a slow month without panic. I size mine in months of fixed costs, not a round number, because that's the cost that has to keep running.

## Automate the happy path

Benjamin Graham, Warren Buffett's teacher, wrote in the most famous book on investing: "The investor's chief problem — and even his worst enemy — is likely to be himself." (*The Intelligent Investor*).

The biggest risk to my money isn't the market, it's me on a tired day, deciding on the spot whether to save or spend. The way out is to take that decision out of the day.

In my routine this became two rules. On the day income lands, a share goes straight to savings and investments, before I see the balance. And when income goes up, the automatic percentage goes up with it, before my spending habits get there first. Manual discipline fails; a schedule doesn't forget.

## Monitor a few numbers

I don't track every coffee. I track a few numbers, like a lean server dashboard: what came in, what went out, what was saved and how many months the fund covers. If one of them leaves its normal range, I dig in. The rest is noise.

![Bar chart with a dashed alert line](img:monitor "One alert line beats a hundred metrics. Illustration by the author")

## Where the analogy breaks

Money isn't just engineering. There are personal goals, family and surprises no spreadsheet covers, and cutting everything "non-essential" can make life pretty dull. And I'm not an advisor: this is how I organize mine, not investment advice.

But the lesson I brought from the server holds: a system nobody watches breaks quietly. Start by listing your fixed costs this week; it's the `docker ps` of your finances.
