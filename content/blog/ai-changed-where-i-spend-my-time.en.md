Banner: Johannes Vermeer, *The Geographer* (c. 1668–1669), Städel Museum. A man, his instruments and the decision none of them makes for him. {{credit:banner}}

Almost all the code that lands in my projects now goes through a model before it goes through me. And I've never worked this much with my head. AI didn't shrink the work: it moved the bottleneck from the keyboard to the decision. Typing got cheap. Deciding what's worth writing got expensive.

## Fast on new code, slow on old code

In 1975, Fred Brooks wrote the most quoted law in software engineering: "Adding manpower to a late software project makes it later." (*The Mythical Man-Month*).

The reason is that newcomers have to learn the context, and the people already on the project stop working to explain it. An AI model is the colleague who shows up every day remembering nothing.

That's exactly my day. A migration script or a new component takes minutes, because it doesn't depend on any history. A change to an old rule in my SaaS, one that depends on decisions made years ago, takes as long as it always did, except now I spend that time explaining context and reading what the model wrote.

## The bottleneck left the keyboard

Brian Kernighan warned back in the 70s where the hard work lives: "Everyone knows that debugging is twice as hard as writing a program in the first place." (Brian Kernighan and P. J. Plauger, *The Elements of Programming Style*, 1978).

With AI, writing costs almost nothing. What's left is reading, understanding and fixing, which is exactly the hard part.

![A 1947 page from the Harvard Mark II logbook with a moth taped to it, the first recorded "bug"](img:bug "The first documented bug, 1947: someone had to find it. {{credit:bug}}")

My routine changed accordingly. I used to open the editor and start typing. Now I open a 300-line diff and have to decide, line by line, whether it's what I wanted. Reviewing well means knowing what the code should look like before you see what it does look like.

## Writing the spec is the main skill now

Brooks again, in 1986, long before any language model: "The hardest single part of building a software system is deciding precisely what to build." (*No Silver Bullet*).

The model does exactly what you asked, including when you asked wrong. A vague prompt comes back as plausible, generic code. A prompt with context, constraints and an example of the result comes back very close to what I'd have written.

![The IBM System/360, the project Fred Brooks managed at IBM](img:system360 "IBM System/360, the project behind Brooks's essays. {{credit:system360}}")

A concrete example: when I ask for "an export endpoint", I get something generic. When I write "export this month's invoices as CSV, account owner only, streamed so it doesn't blow up memory, using the same date format as the current report", I get something that goes into the project with few changes. The difference is in the text, not in the model.

## Where I don't let AI decide

In 1960, J. C. R. Licklider imagined a partnership between people and computers and was clear about who did what: "Men will set the goals and supply the motivations" (*Man-Computer Symbiosis*).

The model writes with the same confidence when it's right and when it's wrong, and it's easy to mistake confidence for correctness. That's why setting the goal and judging the result stays with me.

![Diagram: the person sets goals, criteria and evaluation; the model drafts, searches and tries alternatives](img:goals "Licklider's split, applied to my day. Illustration by the author")

In practice I keep three rules. I design the database schema and service boundaries first, because mistakes there cost months. Auth, permissions and anything that touches money, I read line by line. And code I can't explain doesn't ship, no matter how green the tests are.

## When this doesn't apply

For small, throwaway code, reviewing this carefully is overkill: accept it, run it, delete it. And if you're just starting out, delegating too early skips the part that teaches you. AI speeds up people who already know where they're going; people who don't, it takes confidently in the wrong direction.

In the end, the bar went up. Writing code stopped being the edge. Knowing what to ask for, spotting what's wrong and saying no is still a human job.
