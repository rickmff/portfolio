I was reading Anthropic's engineering post on Managed Agents, the one with the subtitle "decoupling the brain from the hands", and halfway through I stopped to reread a paragraph. It describes a fix the team made for an old model, and how that fix turned into dead weight when a newer model arrived. That's the kind of thing I usually only notice in my own code months later. So here's what stuck with me, as someone who builds a SaaS and runs it on my own VPS.

## Harnesses go stale

A harness is the loop around the model: it calls Claude, reads the reply, runs the tools it asked for and sends the results back. Every harness carries guesses about what the model can't do yet.

The post gives a clear example. With Claude Sonnet 4.5, the team saw what they call "context anxiety": the model wrapped up tasks early when it sensed the context window filling up. So they added context resets to the harness. With Claude Opus 4.5 the behavior was gone, and the resets were just code nobody needed anymore.

The answer in the post isn't a smarter harness. It's a small set of interfaces that stay put while the harnesses behind them keep changing, which is pretty much what John Gall meant when he said that a complex system that works always grew out of a simple one that worked. They even compare it to an operating system: "process" and "file" outlived every piece of hardware they ran on.

## Brain, hands and a log

The design splits an agent into three parts:

- **Session**: an append-only log of everything that happened.
- **Harness** (the brain): the loop that calls the model and routes its tool calls.
- **Sandbox** (the hands): where code runs and files get edited.

![Diagram: the harness reads and writes the session log, and calls sandboxes and tools through one execute interface](img:agents-en "Brain, hands and log, each replaceable on its own")

In Managed Agents, every hand looks the same to the brain: `execute(name, input) → string`. A container, an MCP server or, in their example, a Pokémon emulator, all behind the same signature. Think of a power outlet: you plug in a phone charger, a kettle or a lamp, and the wall doesn't care which. Aristotle called the hand "the tool of tools", and that's exactly the job it does here.

## Cattle, not pets

The first version put all three parts in one container. Anyone who runs servers knows how that ends. The container becomes a pet: if it dies, the session goes with it, and someone has to nurse it back to health without being able to look inside, because it holds user data.

After the split, the container is cattle. If it dies, the error comes back to Claude as a failed tool call, and a new one is provisioned. The harness is cattle too: since the log lives outside it, a new harness calls `wake(sessionId)`, reads the events and carries on from the last one.

It's the same rule I'd give anyone running their own server: state lives in the database and in backups, never in the box itself. Seeing it applied to agents made the design click right away.

## Keep the keys out of the sandbox

In the coupled design, the code Claude wrote ran next to the credentials. One prompt injection that convinced the model to read its environment would have been enough.

It's like giving the house cleaner a code for the front door instead of a copy of your keys. The fix is structural. The git token clones the repo when the sandbox starts and stays inside the git remote, so push and pull work without the agent ever seeing it. MCP tokens sit in a vault and go through a proxy. In the post's words, "the harness is never made aware of any credentials."

Benjamin Franklin joked that three people can keep a secret if two of them are dead. Here nobody has to die: the agent can't leak a token it never saw. I like that because it doesn't depend on the model behaving well. It removes the chance to behave badly.

## The log isn't the context window

The part I found most interesting is the difference between the session and the context window. Compaction and trimming are decisions you can't undo: you throw something away today without knowing whether you'll need it tomorrow. In Managed Agents, the log keeps everything, and the harness picks what goes into the window, with `getEvents()` able to read slices, go back and reread what led to a moment.

Storage is one job and context management is another. The first has to be durable. The second can change with every new model.

## Faster too

Taking the harness out of the container also made it faster. Before, every session waited for a container to start, even if it never used one. Now a container only starts when a tool asks for it. The team reports time to first token dropping about 60% at the median and more than 90% at p95.

## What I'm taking from it

If I were to sum it up in one line: be strict about the shape of the interfaces and relaxed about what runs behind them. It works for agents, and it works for the rest of the stack. The model will change, the harness will change, the sandbox will change. The log and the contract between them are what should stay.
