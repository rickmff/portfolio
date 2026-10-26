These days almost every line of code that lands in my projects goes through a model before it goes through me. You'd think that means I work less. It's the opposite: I've never worked this much with my head. Typing got cheap. Deciding what's worth typing got expensive.

## Fast on new code, slow on old code

Picture hiring someone who's great at the job but forgets everything overnight. Every morning you explain the project from scratch, where things live and why that weird rule exists. That's working with an AI model. Fred Brooks noticed something close to this decades ago, when he said that adding people to a late software project only makes it later: whoever arrives has to learn the context, and whoever's already there stops to explain it.

That's exactly how my day goes. A migration script or a new component takes minutes, because it doesn't depend on any history. Changing an old rule in my SaaS, one that rests on decisions made years ago, takes as long as it always did. The difference is that now I spend that time explaining context and reading what the model wrote.

## The bottleneck left the keyboard

Think of cooking with a friend who chops everything in two minutes. Dinner doesn't get ready any faster if you still have to check every piece to see if they cut it the way the recipe asked. The chopping got cheap; the checking didn't.

Code works the same way. Brian Kernighan used to say that everyone knows debugging is twice as hard as writing the program in the first place. With AI, writing costs almost nothing. What's left is reading, understanding and fixing, which was always the hard part.

![A 1947 page from the Harvard Mark II logbook with a moth taped to it, the first recorded "bug"](img:bug "The first documented bug, 1947: someone had to find it")

So my routine flipped. I used to open the editor and start typing. Now I open a 300-line diff and decide, line by line, whether it's what I wanted. And you can only review well if you know what the code should look like before you see what it actually looks like.

## Asking well is the main skill now

Ever asked someone to "grab something for dinner" and got back a frozen pizza? Nobody did anything wrong; you just weren't clear. The model is like that: it does exactly what you asked, even when you asked badly. Brooks also said the hardest single part of building software is deciding precisely what to build, and he said it long before anyone was chatting with a language model.

A real example: when I ask for "an export endpoint", I get something generic. When I write "export this month's invoices as CSV, account owner only, streamed so it doesn't blow up memory, using the same date format as the current report", I get something that goes into the project with few changes. Same model. What changed was the text.

## Where I don't let AI decide

The model talks with the same confidence when it's right and when it's wrong, like that friend who gives you directions with total certainty and sends you to the wrong side of town. It's easy to mistake confidence for being correct. J. C. R. Licklider, who imagined this partnership between people and computers back when computers filled entire rooms, already had the split clear: people set the goals and supply the motivation, the machine does the rest.

![Diagram: the person sets goals, criteria and evaluation; the model drafts, searches and tries alternatives](img:goals "Licklider's split, applied to my day")

In practice I keep three rules. I design the database schema and the boundaries between services myself, first, because a mistake there costs months. Auth, permissions and anything that touches money, I read line by line. And code I can't explain doesn't ship, no matter how green the tests are.

## When this doesn't apply

For small, throwaway code, all this care is overkill. A script to rename a pile of files? Accept it, run it, delete it. And if you're just starting out, handing everything over too early skips the part that actually teaches you. AI speeds up people who already know where they're going. People who don't, it takes in the wrong direction, very confidently.

In the end, the bar went up. Writing code stopped being the edge. Knowing what to ask for, spotting what's wrong and saying no is still a human job.
