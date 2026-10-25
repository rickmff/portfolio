Banner: J. M. W. Turner, *Rain, Steam and Speed* (1844), National Gallery. The engine only becomes a journey because of the rails. {{credit:banner}}

Every month a new model claims to be the best in the world. And almost every month, what actually changes my day is something else: the harness, the layer around the model that decides what it sees, what it can do and when it stops. The model is the engine. The harness is the car.

## The model thinks, the harness acts

In 1836, Thomas Carlyle wrote a line that fits people and, today, agents:

> "Nowhere do you find him without Tools; without Tools he is nothing, with Tools he is all."
> Thomas Carlyle, *Sartor Resartus* (1836)

A model on its own takes text in and puts text out. What turns that into work is the loop around it: call the model, run the action it asked for, return the result and call it again.

![Diagram of an agent loop: the model thinks, the harness runs the tool, the result goes back to the model](img:loop "An agent's loop. Illustration by the author")

That's exactly what I see in Claude Code: it reads a file, runs the tests, reads the error, fixes it and runs them again. Claude Code, Cursor and Codex are harnesses. The same model in different harnesses feels like a different product.

## Automate what doesn't need thinking

In 1911, the mathematician Alfred North Whitehead wrote:

> "Civilization advances by extending the number of important operations which we can perform without thinking about them."
> Alfred North Whitehead, *An Introduction to Mathematics* (1911)

A good harness does that for the agent. It doesn't have to rediscover how the project works every session, because it's already written down.

![Portrait of Joseph Marie Jacquard woven in silk on a Jacquard loom](img:jacquard "Jacquard's portrait, woven on his own loom and driven by thousands of punched cards: the pattern was stored, nobody had to remember it. {{credit:jacquard}}")

Mine has three parts. An instructions file at the repo root, with conventions, build commands and what never to do: the onboarding I'd give a new developer. Skills, which turn repeated procedures into reusable instructions: this post was reviewed and published by two of them, which call the site's content API. And hooks, which run lint and tests after every edit, so the agent sees the error before I do.

## Trust, but verify

Ronald Reagan popularized a Russian proverb when signing a disarmament treaty with Gorbachev in 1987:

> "Trust, but verify."
> Ronald Reagan (1987)

It's the best description I know of how to set up an agent. The tools a model gets matter as much as the model: clear commands, short outputs and explicit limits make an average model look good, and confusing tools make a good model look lost.

![Watt's centrifugal governor, which controlled the speed of steam engines](img:governor "Watt's governor didn't make the engine stronger, it made it safe to use. {{credit:governor}}")

In practice, the most important part of my harness is permissions. The agent can read anything in the project, but deploys, deletes and anything that touches production on my VPS go through me. It's the same principle as Watt's governor: it doesn't make the engine stronger, it makes it safe.

## When it's not worth it

In 2019, Rich Sutton opened a famous essay like this:

> "The biggest lesson that can be read from 70 years of AI research"
> Rich Sutton, *The Bitter Lesson* (2019)

The lesson, in his words, is that general methods that use more computation end up beating solutions packed with built-in human knowledge. The classic example is chess, where brute-force search overtook years of hand-written heuristics.

![IBM's Deep Blue, which beat Kasparov in 1997](img:deepblue "Deep Blue: brute force beat hand-written heuristics. {{credit:deepblue}}")

The lesson for harnesses is to keep the layer thin. A rule that only exists to work around a weakness of today's model becomes dead weight when the next model ships. For a one-off question or a ten-line script, plain chat is enough. The harness pays off when the work repeats: the same repo, the same flows, week after week.

My advice is simple: before switching models, write your project's instructions file. My [Harness](/harness) page lists the tools I use every day.
