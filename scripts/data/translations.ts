// Translations of existing content, applied once by the seed (only where a field is still empty).
// Books are matched by their base title. Most base text is Portuguese, so `en` carries the
// English version; a few books were written in English and get a `pt` version instead.
// New content is translated by the portfolio-content skill through the API, not here.

type Fields = Partial<Record<"title" | "synopsis" | "notes" | "note", string>>;
export type BookTranslation = { title: string; en?: Fields; pt?: Fields };

export const bookTranslations: BookTranslation[] = [
  {
    title: "Contos",
    en: {
      title: "Tales",
      synopsis:
        "A selection of Edgar Allan Poe's best-known stories, from the master of psychological horror and the inventor of the detective story. Unreliable narrators, houses that seem alive and puzzles solved by pure logic.",
      notes: `### 1. **The Black Cat**

*"Guilt and drink turn a man into a murderer, but the cry of a cat walled up with the body gives his crime away."*

### 2. **The Tell-Tale Heart**

*"A killer tries to prove his sanity, but the sound of an imagined heartbeat makes him confess."*

### 3. **The Fall of the House of Usher**

*"The physical and mental decay of the Usher family ends with the literal collapse of the mansion."*

### 4. **The Cask of Amontillado**

*"Montresor lures Fortunato into the catacombs and walls him in alive for revenge."*

### 5. **Berenice**

*"A dental obsession drives Egaeus to pull the teeth of his bride, who was still alive."*

### 6. **The Pit and the Pendulum**

*"Between deadly blades and a bottomless pit, rescue comes in the final seconds."*

### 7. **The Masque of the Red Death**

*"No wall can protect Prince Prospero and his guests from Death itself."*

### 8. **William Wilson**

*"Trying to kill his doppelgänger, William finds he has destroyed himself."*

### 9. **The Gold-Bug**

*"An encrypted riddle leads to buried pirate treasure."*

### 10. **The Purloined Letter**

*"Detective Dupin finds a valuable letter where nobody thought to look: in plain sight."*

### 11. **The Oval Portrait**

*"The beauty of the art drains the life from its model, blurring reality and painting."*

### 12. **Ligeia**

*"The mysterious Ligeia seems to rise again, taking over the body of the narrator's new wife."*

### 13. **The Man of the Crowd**

*"A man follows an aimless stranger through the city and finds only emptiness."*

### 14. **The Facts in the Case of M. Valdemar**

*"A dying man hypnotised at the moment of death is held between life and decay."*

### 15. **Morella**

*"The wife dies, but her soul seems reborn in their daughter, to her father's horror."*`,
    },
  },
  {
    title: "A Sutil Arte de Ligar o Foda-se",
    en: {
      title: "The Subtle Art of Not Giving a F*ck",
      synopsis:
        "Mark Manson pushes back on positive-thinking self-help: instead of trying to care about everything, life gets better when you carefully choose the few things that actually deserve your energy.",
      notes: `- You can't care about everything, energy is limited. The point is **choosing what to care about**
- Wanting a positive experience all the time is itself a negative experience (**the backwards law**)
- Pain is part of it. Happiness comes from **solving problems**, not from not having them
- What pain are you willing to sustain? What you want is defined by the sacrifice you accept
- You are not special. Accepting that takes away the weight of having to be extraordinary all the time
- **Bad values**: pleasure, material success, always being right, always being positive
- **Good values**: honesty, responsibility, humility, curiosity
- Fault and responsibility are different things. Not everything is your fault, but everything that happens to you is your responsibility
- Be suspicious of your own certainties, we are wrong about a lot
- Knowing how to say no is what gives the yes its value
- Thinking about death helps put everything else in perspective`,
    },
  },
  {
    title: "Inabalável",
    en: {
      title: "Unshakeable",
      synopsis:
        "Tony Robbins interviewed big names in finance to put together a practical guide to financial freedom: how fees, compound interest and asset allocation work, and how to build a portfolio that can weather any market.",
      notes: `- **Compound interest** is the most important force: starting early beats starting with a lot
- Small fees destroy wealth over the long run. Always check how much you are paying
- Nobody can predict the market consistently, not even the professionals
- Low-cost **index funds** beat most actively managed funds
- **Asset allocation** is the most important decision: splitting between safety and growth
- Rebalance the portfolio periodically
- Crashes and corrections are part of the cycle, not the end. Whoever doesn't sell in a panic recovers
- **All Seasons portfolio** (Ray Dalio): build something that survives inflation, deflation, growth and recession
- Have an emergency fund before taking on risk
- Set a number: how much you need to be financially free
- Automate contributions so you don't depend on willpower`,
    },
  },
  {
    title: "A Arte da Guerra",
    en: {
      title: "The Art of War",
      synopsis:
        "The Chinese military treatise attributed to Sun Tzu, written more than two thousand years ago. Thirteen short chapters on strategy, planning and knowing the terrain, still read today as lessons in leadership and business.",
      notes: `- "Know the enemy and know yourself, and you need not fear the result of a hundred battles"
- The **supreme art of war** is to win without fighting
- All warfare is based on **deception**: when able, appear unable
- Victory is decided before the battle, in the **planning**
- The five factors: the way (moral law), weather, terrain, command and discipline
- Long wars wear down even the winner. Speed matters
- Attack where the enemy is unprepared, appear where you are not expected
- Be like water: take the shape of the terrain
- Never corner the enemy completely, leave a way out
- A good general creates the right situation instead of relying on the soldiers
- Know when to fight and when not to`,
    },
  },
  {
    title: "Hamlet",
    en: {
      synopsis:
        "The Prince of Denmark is visited by his father's ghost, who reveals a crime and demands revenge. Torn between doubt and duty, Hamlet feigns madness while the court of Elsinore fills with suspicion.",
      notes: `- **To be or not to be**: doubt paralyses more than fear does
- Hamlet thinks too much and acts too little, and the delay costs everyone dearly
- Feigned madness works as a mask for telling the truth
- **The play within the play**: using art to expose guilt ("the play's the thing")
- Polonius: "to thine own self be true", good advice from someone who doesn't follow it
- Corruption at the top poisons the whole kingdom ("something is rotten in the state of Denmark")
- Ophelia is the biggest victim of everyone else's games
- Revenge breeds more revenge: by the end, almost no one is left
- Yorick's skull: everyone ends up the same in the face of death
- "The rest is silence"`,
    },
  },
  {
    title: "O Pequeno Príncipe",
    en: {
      title: "The Little Prince",
      synopsis:
        "A pilot crashes in the Sahara and meets a little prince from a faraway asteroid. Between drawings of sheep and stories of strange planets, a fable about friendship, love and how children see the world of grown-ups.",
      notes: `- "What is essential is invisible to the eye, one sees clearly only with the heart"
- "You become responsible, forever, for what you have tamed"
- Grown-ups only understand numbers, they have forgotten what it is like to be a child
- **The rose**: what makes her unique is the time spent on her
- **The fox**: taming is creating ties, and creating ties means risking being hurt
- Each planet is a kind of grown-up: the king, the conceited man, the drunkard, the businessman, the lamplighter, the geographer
- The businessman counts stars to own them but enjoys none of them
- The baobabs: small problems have to be pulled out early, before they grow
- You have to put up with two or three caterpillars if you want to know the butterflies
- The desert is beautiful because somewhere it hides a well`,
    },
  },
  {
    title: "1984",
    en: {
      synopsis:
        "In a totalitarian superstate watched over by Big Brother, Winston Smith works rewriting history for the Party. When he starts to doubt and to keep forbidden thoughts, he learns the price of wanting to be free.",
      notes: `rule of the party

who controls the past controls the future

.the ministry of truth rewrites history

.whoever controls memory controls reality

newspeak

fewer words to allow fewer thoughts

.with no word for rebellion, there is no rebellion

.doublethink: accepting two contradictory ideas at the same time

surveillance

big brother is watching you

.telescreens everywhere

.constant fear breeds obedience

.children informing on their parents

hate

two minutes hate

.an outside enemy unites people

.permanent war keeps order

the end

.freedom is being able to say that 2 + 2 = 4

.the party doesn't want obedience, it wants you to love big brother

.room 101: each person's own fear used against them`,
    },
  },
  {
    title: "Mente Milionária",
    en: {
      title: "Secrets of the Millionaire Mind",
      synopsis:
        'T. Harv Eker argues that our relationship with money is programmed in childhood, and that this inner "money blueprint" decides the results. The book contrasts how the rich and the poor think and offers exercises to reprogram that mindset.',
    },
  },
  {
    title: "Pai Rico, Pai Pobre",
    en: {
      title: "Rich Dad Poor Dad",
      synopsis:
        "Robert Kiyosaki tells what he learned about money from two fathers: his own, educated and well employed, and his friend's father, a businessman without a degree. The difference between assets and liabilities is the starting point for rethinking work, debt and investing.",
      notes: `- I have to learn to save money and not spend everything I earn
- Before buying something, I should think about whether I really need it
- I want to learn to invest so my money grows
- I shouldn't depend on a salary alone, I can look for other ways to earn money
- I have to learn more about money to make better decisions
- The most important thing isn't earning a lot of money, it's knowing how to use it well
- I want to start thinking more about my future and not only about what I can buy today
- I should avoid spending money just to impress other people
- It's important to have financial goals and work towards them
- I want to learn to tell apart what makes me money from what makes me spend it
- I should be careful with debt and avoid borrowing when I don't need to
- Instead of spending everything on things that lose value, I should think about investing in my future
- I have to understand that getting rich doesn't happen overnight
- I should use my time to learn things that can help me earn more
- I shouldn't be afraid to learn new things about investing
- I want to stop working only to pay bills and start building a life with more financial freedom
- I have to be patient, because results take time
- It's important to learn from my mistakes and not give up when something goes wrong
- I want to make better decisions with the money I have, even if it's not much
- My mindset about money can make a big difference to my future`,
    },
  },
  {
    title: "As 16 Leis do Sucesso",
    en: {
      title: "The Law of Success in Sixteen Lessons",
      synopsis:
        "Drawn from years of interviews with early twentieth-century businessmen, Napoleon Hill's course arranges into sixteen lessons the habits that, in his view, separate people who achieve from people who only wish: a definite purpose, self-confidence, initiative and persistence.",
      notes: `- **Master mind**: bringing together people with the same goal multiplies what each of them can do
- **A definite chief aim**: without a clear target, all effort scatters
- **Self-confidence** is built, nobody is born with it
- **The habit of saving**: keeping part of what you earn gives you freedom of choice
- **Initiative and leadership**: doing without needing to be told
- **Imagination**: every achievement starts as an idea
- **Enthusiasm** is contagious and moves the people around you
- **Self-control**: whoever can't control themselves controls nothing
- **Doing more than you are paid for**
- **A pleasing personality** opens more doors than talent
- **Accurate thought**: separating facts from opinions
- **Concentration** on one thing at a time
- **Cooperation** instead of competition
- **Profiting by failure**: every defeat carries the seed of an equivalent advantage
- **Tolerance** of people who think differently
- **The golden rule**: treat others as you would like to be treated`,
    },
  },
  {
    title: "Percy Jackson (coleção)",
    en: {
      title: "Percy Jackson (series)",
      synopsis:
        "Percy is a twelve-year-old with dyslexia and ADHD who keeps getting into trouble, until he finds out he is the son of a Greek god. At Camp Half-Blood he sets off on quests across the United States, where the monsters and gods of Olympus are still very much alive.",
      notes: `- What looked like flaws (dyslexia, ADHD) were signs of another nature: a brain wired for ancient Greek and battle instincts
- **Loyalty** is Percy's great strength and also his fatal flaw
- The gods are powerful but flawed, selfish and absent as parents
- Greek mythology retold in the modern world: Olympus on top of the Empire State Building, the Underworld in Los Angeles
- Annabeth: intelligence and planning are worth as much as strength
- Grover: courage isn't the absence of fear
- Luke shows how resentment towards your parents can be used by someone worse
- **Prophecies** come true, but never the way you expect
- The unclaimed demigods: being ignored hurts more than being hated
- Choices matter more than where you come from`,
    },
  },
  {
    title: "Diário de um Banana",
    en: {
      title: "Diary of a Wimpy Kid",
      synopsis:
        'Greg Heffley starts middle school writing in his diary (which he insists on calling a "journal") about his plans to become popular. Illustrated with Greg\'s own doodles, it is a comedy about school, family and a best friend who doesn\'t care about any of it.',
      notes: `- Greg wants to be popular at any cost, and the plan almost always backfires
- Rowley is the opposite: he doesn't try to be cool, and that's why he ends up being cool
- **The Cheese**: the school rule nobody questions and everybody fears
- The brothers: Rodrick torments him, Manny is protected by the parents
- Greg almost never takes the blame for his own mistakes
- The humour comes from showing selfishness honestly
- Friendship is worth more than status
- The drawings tell half of the story`,
    },
  },
  {
    title: "Steve Jobs",
    en: {
      synopsis:
        "The authorised biography of Steve Jobs, written by Walter Isaacson from more than forty interviews with Jobs and with his friends, family, rivals and colleagues. From the garage in Los Altos to the iPhone, a portrait of a difficult genius who changed several industries.",
      notes: `- **Reality distortion field**: making people believe the impossible is possible
- Focus means saying no to a thousand good ideas
- **Simplicity** is the ultimate sophistication
- End-to-end integration: hardware and software together, controlling the whole experience
- Care for details even where nobody looks (the inside of the Mac)
- The right products come from the intersection of **technology and the humanities**
- Being fired from Apple was the best thing that happened: NeXT and Pixar
- Hire only A players, they attract other A players
- The dark side: rudeness, control and trouble dealing with people
- People don't know what they want until you show it to them
- Think different: "the people who are crazy enough to think they can change the world are the ones who do"`,
    },
  },
  {
    title: "As 48 Leis do Poder",
    en: {
      title: "The 48 Laws of Power",
      synopsis:
        "Robert Greene draws on three thousand years of history, from royal courts to con artists, for 48 laws on how power is won, kept and lost. A cold manual full of examples, as useful for playing the game as for defending yourself from it.",
      notes: `- **Law 1**: never outshine the master
- **Law 3**: conceal your intentions
- **Law 4**: always say less than necessary
- **Law 5**: so much depends on reputation, guard it with your life
- **Law 6**: court attention at all costs
- **Law 9**: win through your actions, never through argument
- **Law 15**: crush your enemy totally
- **Law 16**: use absence to increase respect and honour
- **Law 18**: do not build fortresses to protect yourself, isolation is dangerous
- **Law 25**: re-create yourself
- **Law 28**: enter action with boldness
- **Law 29**: plan all the way to the end
- **Law 30**: make your accomplishments seem effortless
- **Law 33**: discover each man's thumbscrew
- **Law 38**: think as you like but behave like others
- **Law 48**: assume formlessness

.read it as defence: understand the game so you aren't used in it`,
    },
  },
  {
    title: "The Champion's Mind",
    pt: {
      title: "A Mente do Campeão",
      synopsis:
        "O psicólogo do esporte Jim Afremow usa o trabalho com atletas olímpicos e profissionais para mostrar como os campeões pensam: construir confiança, manter o foco sob pressão, se recuperar dos tropeços e manter as rotinas que tornam o alto desempenho repetível.",
      notes: `- **Resistência mental**:
  - O exemplo de Michael Phelps, apesar das dificuldades e lesões no começo da carreira
  - Usou os desafios como combustível, mantendo a cabeça positiva sob pressão
  - Resistência mental se constrói superando adversidades e se mantendo positivo
  - Praticar "resets mentais" nos tropeços, focando na próxima tarefa e não no erro
- **Visualização**:
  - O ensaio mental ajuda a chegar preparada e confiante na competição
  - Visualizar não é só imaginar o sucesso… é ensaiar mentalmente cada cenário
  - Praticar "imagens mentais positivas", imaginando o sucesso mas também como lidar com adversidades e imprevistos
- **Confiança**:
  - Kobe Bryant construiu a confiança com anos de preparação, não só com talento natural
  - Confiança vem de preparação consistente e de confiar nas próprias habilidades
  - Afirmações e visualização para reforçar a confiança. Afirmações, principalmente junto com a preparação física, solidificam a autoconfiança
- **Foco**:
  - Tiger Woods bloqueia todas as distrações e fica totalmente no presente durante os torneios
  - Treina o foco mental para evitar erros e ficar calmo sob pressão
  - Ficar focado na tarefa e bloquear distrações é essencial para o alto desempenho
  - **Exercícios de foco**, em que o atleta treina ficar no presente, como focar em uma única coisa por um tempo ou fazer tarefas em intervalos para treinar a concentração
- **Motivação**:
  - A motivação de Usain Bolt vinha da vontade de quebrar recordes e melhorar sempre
  - A motivação deve vir da vontade de passar dos próprios limites e melhorar, não só de vencer os outros, mas de comparar você de hoje com você de ontem
  - Definir **metas pessoais de desempenho** e não só metas externas
- **Rotina e consistência**:
  - Serena Williams mantém uma rotina diária rígida, com aquecimentos, exercícios e treinos mentais específicos
  - A consistência no treino foi a chave do sucesso a longo prazo
  - Sucesso não é só talento, é manter uma rotina consistente ao longo do tempo
  - Montar rotinas que juntem treino físico e exercícios mentais, como parte do dia a dia e não só nas sessões de treino`,
    },
  },
  {
    title: "12 Regras para a Vida",
    en: {
      title: "12 Rules for Life",
      synopsis:
        "Psychologist Jordan Peterson combines mythology, neuroscience, religion and clinical cases into twelve rules for finding order and meaning amid the chaos of life, from how you hold your body to how you speak to people.",
      notes: `### rule 1

stand up straight with your shoulders back

- lobsters
- primitive brain
- serotonin
- dominance hierarchy
- face the uncertainty of the world voluntarily, with faith and courage

### rule 2

treat yourself like someone you are responsible for helping

- not taking the medicine
- chaos and order
- give life meaning
- strengthen the individual

### rule 3

make friends with people who want the best for you

- drugs
- use your judgement
- average of the 5

### rule 4

compare yourself to who you were yesterday, not to who someone else is today

- tame the inner critic
- are you a tyrant or do you negotiate with yourself?
- narrow your field of view
- find the real reason behind the thought

### rule 5

do not let your children do anything that makes you dislike them

- badly raised children
- use force wisely

### rule 6

set your house in perfect order before you criticise the world

- serial killers
- start small
- be rational
- don't embellish what doesn't need it (primitiveness)

### rule 7

pursue what is meaningful, not what is expedient

- don't trade the present for the future
- adam and eve
- meaning > moment

### rule 8

tell the truth. or, at least, don't lie

- truth is the principle of order
- manipulation comes from untruth
- don't be fooled by inner lies, look for the essence

### rule 9

assume that the person you are listening to might know something you don't

- be genuine in conversations (without the social filter)
- find out for yourself
- listening means something else (without judging)

### rule 10

be precise in your speech

- be precise in your ideas so you don't drown in the complexity of the world
- never underestimate the destructive power of sins of omission
- work with reality, without assumptions or imprecise claims
- confront chaos with the precision of being

### rule 11

do not bother children when they are skateboarding

- danger (living on the edge) drives progress
- don't hold others back, it can hurt your whole development
- don't believe the "self-appointed judges of the human race"
- patriarchy: has more good in it than people think
- ideas have consequences (marx)
- differences between men and women are natural
- don't be insufficiently aggressive, sometimes you have to stand your ground

### rule 12

pet a cat when you encounter one on the street

- accept that BEING comes with its suffering and its limits, without them it wouldn't be BEING
- take some moment of your day to restore the strength of your purpose, either doing something you enjoy or just not doing what's expected`,
    },
  },
  {
    title: "The Obstacle Is the Way",
    pt: {
      title: "O Obstáculo é o Caminho",
      synopsis:
        "Com base em Marco Aurélio e nos estoicos, Ryan Holiday mostra como grandes figuras da história transformaram os problemas à sua frente no próprio caminho, pela disciplina da percepção, da ação e da vontade.",
      notes: `O livro é inspirado na **filosofia estoica** e explica que **contratempos, frustração, medo e fracasso não são interrupções na sua vida, são a matéria-prima do progresso**.

Em vez de perguntar

> "Como eu me livro desse problema?"
>
> o livro ensina a perguntar
>
> "Como eu posso usar esse problema?"

Toda a mentalidade se organiza numa estrutura bem prática:

### 1. Percepção

Você aprende a:

- parar de exagerar os problemas na sua cabeça
- separar fatos de emoções
- ver os obstáculos como acontecimentos neutros

Na prática: a maior parte do sofrimento não vem do que acontece, mas de como você interpreta.

### 2. Ação

Você aprende a:

- focar só no que é controlável
- quebrar os obstáculos em passos pequenos e executáveis
- agir mesmo quando as condições não são perfeitas

O livro insiste que **esperar ter clareza ou confiança é uma armadilha**: a clareza vem de fazer.

### 3. Vontade

Você aprende a:

- aceitar o que não pode mudar
- se manter firme sob pressão
- usar as dificuldades para construir resistência emocional

Essa parte é sobre resiliência de longo prazo, não motivação de curto prazo.

---

Obstáculos não são só desafios a superar,

são **o campo de treino exato que desenvolve suas habilidades, seu caráter e sua alavancagem**.

Em resumo:

> Aquilo que você quer evitar normalmente é o que te torna melhor, mais forte e mais capaz.`,
    },
  },
  {
    title: "O Homem do Castelo Alto",
    en: {
      title: "The Man in the High Castle",
      synopsis:
        "In the United States of 1962, the Axis won the Second World War: the country is split between Nazi Germany and Japan. Among traders, spies and a banned novel that imagines another ending to the war, Philip K. Dick questions what is real.",
    },
  },
  {
    title: "Roube como um Artista",
    en: {
      title: "Steal Like an Artist",
      synopsis:
        "A short, illustrated manifesto by Austin Kleon on creativity in the digital age: nothing is original, every work grows out of influences, and the trick is to copy well, remix your references and show your work.",
    },
  },
  {
    title: "The Hard Thing About Hard Things",
    pt: {
      title: "O Lado Difícil das Situações Difíceis",
      synopsis:
        "Ben Horowitz, cofundador da Andreessen Horowitz, deixa de lado o otimismo das startups e escreve sobre o que ninguém te prepara para enfrentar: demissões, ter que demitir amigos, quase falir e o trabalho solitário de ser CEO quando não existe resposta fácil.",
    },
  },
  {
    title: "A Revolta de Atlas",
    en: {
      title: "Atlas Shrugged",
      synopsis:
        "In a declining United States, the most brilliant industrialists and inventors are disappearing one by one. Dagny Taggart tries to save her family's railroad while working out who is behind it. The novel that sums up Ayn Rand's philosophy.",
    },
  },
  {
    title: "Iludidos pelo Acaso",
    en: {
      title: "Fooled by Randomness",
      synopsis:
        'Nassim Taleb, a former trader and mathematician, shows how we mistake luck for skill, especially in markets. The first book of the series that led to "The Black Swan", about how chance shapes outcomes far more than we admit.',
      notes: `- We mistake **luck for skill**, especially when the outcome is good
- **Survivorship bias**: we only see the traders who made it, not the thousands who blew up
- **Alternative histories**: judge a decision by what could have happened, not only by what did
- Russian roulette: winning 10 million with a 1 in 6 chance of dying is not a good decision, even if you win
- The more often you look at results, the more noise and the less signal you see
- **Rare events** are underestimated until they happen
- The problem of induction: a thousand white swans don't prove there is no black swan
- Falsifying is more useful than confirming (Popper)
- Be **sceptical** of your own theories
- Asymmetry: what matters is the size of the gain or loss, not just the probability`,
    },
  },
  {
    title: "O Andar do Bêbado",
    en: {
      title: "The Drunkard's Walk",
      synopsis:
        "Physicist Leonard Mlodinow tells the history of probability, from Cardano to Bayes, to show how chance governs far more of our lives (careers, investments, sport) than we are willing to admit.",
      notes: `- The right hemisphere of the brain is more tied to primitive instinct, while the left is more tied to reason.
- To improve your odds of beating randomness, rely on repetition.
- **Availability bias**: when we base a decision on our most vivid memories (they are more "available" to us). What we've lived through most doesn't necessarily reflect reality.
- **Law of combined probabilities**: if event A and event B are independent (NO relation between them), the probability of both happening is the product A\\*B. For the probability of A or B, we add A + B.
- Girolamo Cardano was one of the fathers of probability theory.
- **Cardano's rule**: in a random process, the probability of something happening is its share of all the possible outcomes. All those outcomes together are called the sample space.
- Short-term results are extremely unreliable as proof of skill.
- Any artificial device is bound to be biased (like a die), because humans have no access to perfection.
- "Complete chaos is, ironically, a kind of perfection".
- **Law of large numbers (Bernoulli's theorem)**: results reflect the underlying probabilities when run at large scale.
- **Law of small numbers**: a small sample probably doesn't reflect the underlying probabilities.
- We shouldn't judge people's actions by the outcome but by their skill (fundamental analysis).
- An event is **NOT** more or less likely to happen because it happened recently.
- The chance that several events happen because they come from one cause is different from the chance that something happens because it comes from several events (conspiracy theories).
- According to Bayes, the probability of A given B is usually different from the probability of B given A.
- Measurements always carry uncertainty.
- A standard-deviation normal curve (the normal distribution, the law of errors) is a signature of a random process.
- Much of the order we find in nature hides an underlying disorder.
- Humans can't intuitively grasp randomness.
- In real life we have a certain illusion of control, but chance decides much more than we realise.
- **Confirmation bias**: we always try to prove our ideas right, never wrong.
- Preconceptions can make us believe a pattern isn't random, even when it is.
- We should give more weight to our impression of someone than to their results.
- We underestimate the role of chance in the lives of the successful and the unsuccessful alike.

First law of probability: the probability that two events both occur can never be greater than the probability that each event occurs on its own.`,
    },
  },
  {
    title: "Como me Tornei Estúpido",
    en: {
      title: "How I Became Stupid",
      synopsis:
        "Antoine is 25, far too intelligent and unhappy because of it. Tired of thinking, he decides to become stupid and tries everything from alcoholism to the stock market. A short, sharp satire of conformity by Martin Page.",
    },
  },
  {
    title: "Eram os Deuses Astronautas?",
    en: {
      title: "Chariots of the Gods?",
      synopsis:
        "Erich von Däniken's 1968 bestseller suggesting that ancient monuments such as the pyramids and the Nazca lines are traces of extraterrestrial visits. One of the most popular, and most contested, works of pseudo-archaeology.",
    },
  },
  {
    title: "Leonardo da Vinci",
    en: {
      synopsis:
        "Walter Isaacson draws on the thousands of pages of Leonardo's notebooks to portray the man behind the Mona Lisa: a relentlessly curious mind that connected art, anatomy, engineering and the close observation of nature.",
    },
  },
  {
    title: "Crime e Castigo",
    en: {
      title: "Crime and Punishment",
      synopsis:
        "Raskolnikov, a destitute former student in Saint Petersburg, convinces himself that certain extraordinary men have the right to step beyond morality. Dostoevsky follows what happens in his mind once he decides to put the theory to the test.",
    },
  },
  {
    title: "Armas, Germes e Aço",
    en: {
      title: "Guns, Germs, and Steel",
      synopsis:
        "Why did Europeans conquer the Americas and not the other way round? Jared Diamond answers with geography, farming, the domestication of animals and disease, in a Pulitzer-winning rereading of 13,000 years of human history.",
    },
  },
  {
    title: "O Homem e seus Símbolos",
    en: {
      title: "Man and His Symbols",
      synopsis:
        "Carl Jung's last project, written for a general audience: an illustrated introduction to the unconscious, dreams, archetypes and the symbols that keep returning in myths, religions and art.",
    },
  },
  {
    title: "A Metamorfose",
    en: {
      title: "The Metamorphosis",
      synopsis:
        "One morning Gregor Samsa wakes up transformed into a monstrous insect. Kafka's novella follows how he and his family, who depend on his wages, react, in one of the strangest and most haunting stories in literature.",
    },
  },
  {
    title: "Como Fazer Amigos e Influenciar Pessoas",
    en: {
      title: "How to Win Friends and Influence People",
      synopsis:
        "Dale Carnegie's 1936 classic on human relations: simple principles (take an interest in others, remember names, avoid criticism) for building connections, persuading without arguing and leading without resentment.",
    },
  },
  {
    title: "O Quarto Reich",
    en: { title: "The Fourth Reich" },
  },
  {
    title: "Sociedade do Cansaço",
    en: {
      title: "The Burnout Society",
      synopsis:
        "A short essay by philosopher Byung-Chul Han: we have left the disciplinary society of prohibitions for the achievement society, in which each of us exploits ourselves to the point of exhaustion, depression and burnout.",
    },
  },
  {
    title: "O Príncipe",
    en: {
      title: "The Prince",
      synopsis:
        'Written by Niccolò Machiavelli in 1513, a blunt manual on how to win and keep power, based on how rulers actually behave rather than how they ought to. The text that gave us the word "Machiavellian".',
    },
  },
  {
    title: "Dedique-se de Coração",
    en: {
      title: "Pour Your Heart Into It",
      synopsis:
        "Howard Schultz tells how he turned a small Seattle coffee bean shop into Starbucks, and how he tried to build a big company without losing its values, its care for employees and the customer experience.",
    },
  },
  {
    title: "Uma Breve História do Tempo",
    en: {
      title: "A Brief History of Time",
      synopsis:
        "Stephen Hawking explains the big questions of cosmology to non-specialists: the Big Bang, black holes, the nature of time and the search for a theory that unifies physics. One of the best-selling popular science books of all time.",
    },
  },
  {
    title: "101 Perguntas e Respostas para Investidores Iniciantes",
    en: {
      title: "101 Questions and Answers for Beginner Investors",
      synopsis:
        "A question-and-answer guide for people starting to invest: fixed income, stocks, funds, risk and the first steps to getting your finances in order.",
    },
  },
  {
    title: "Mais Esperto que o Diabo",
    en: {
      title: "Outwitting the Devil",
      synopsis:
        'Written in 1938 and kept by Napoleon Hill\'s family for more than seventy years, the book is an imaginary interview with the Devil, who reveals how he keeps people trapped by fear, indecision and the habit of "drifting".',
    },
  },
  {
    title: "A Marca da Vitória",
    en: {
      title: "Shoe Dog",
      synopsis:
        "The memoir of Phil Knight, founder of Nike: from selling Japanese running shoes out of the boot of his car to building one of the best-known brands in the world, with all the debts, fights and near-bankruptcies along the way.",
    },
  },
  {
    title: "Meditações",
    en: {
      title: "Meditations",
      synopsis:
        "The private notebooks of the Roman emperor Marcus Aurelius, written to himself during military campaigns. Stoic reflections on duty, death, nature and mastering your own reactions.",
    },
  },
  {
    title: "Sobre a Brevidade da Vida",
    en: {
      title: "On the Shortness of Life",
      synopsis:
        "In a letter to his friend Paulinus, Seneca argues that life is not short, we are the ones who waste it. A short Stoic text on time, pointless busyness and the art of living in the present.",
    },
  },
  {
    title: "O Momento Decisivo",
    en: {
      title: "How We Decide",
      synopsis:
        "Jonah Lehrer uses neuroscience to explain how the brain makes decisions, from pilots and poker players to quarterbacks, and when it pays to trust emotion or reason.",
    },
  },
  {
    title: "A Insustentável Leveza do Ser",
    en: {
      title: "The Unbearable Lightness of Being",
      synopsis:
        "Prague, 1968. The lives of Tomas, Tereza, Sabina and Franz cross during the Prague Spring and the Soviet invasion. Milan Kundera blends fiction and philosophy to think about the weight and lightness of our choices.",
    },
  },
  {
    title: "Breves Respostas para Grandes Questões",
    en: {
      title: "Brief Answers to the Big Questions",
      synopsis:
        "Stephen Hawking's last book answers ten big questions: Is there a God? How did it all begin? Will we survive on Earth? Will artificial intelligence outsmart us? Science and personal opinion from one of the great physicists of the century.",
    },
  },
  {
    title: "Acredite, Estou Mentindo",
    en: {
      title: "Trust Me, I'm Lying",
      synopsis:
        "Ryan Holiday, a former marketing strategist, reveals how he manipulated blogs and the online press to create news out of nothing, and exposes the click economy that makes the media publish first and check later.",
    },
  },
  {
    title: "Predictably Irrational",
    pt: {
      title: "Previsivelmente Irracional",
      synopsis:
        "O economista comportamental Dan Ariely usa experimentos engenhosos para mostrar que nossas más decisões não são aleatórias: supervalorizamos o que é grátis, nos ancoramos em números arbitrários e trapaceamos um pouco, de formas previsíveis e, por isso, corrigíveis.",
    },
  },
  {
    title: "Guerra e Paz",
    en: {
      title: "War and Peace",
      synopsis:
        "Tolstoy's epic follows five families of the Russian aristocracy through the Napoleonic wars, between balls in Saint Petersburg and battlefields such as Austerlitz and Borodino. A novel about history, love and the meaning of life.",
    },
  },
  {
    title: "O Algoritmo Mestre",
    en: {
      title: "The Master Algorithm",
      synopsis:
        "Pedro Domingos introduces the five great schools of machine learning (symbolists, connectionists, evolutionaries, Bayesians and analogisers) and the search for a single algorithm able to learn anything from data.",
    },
  },
  {
    title: "O Mínimo que Você Precisa Saber para Não Ser um Idiota",
    en: {
      title: "The Least You Need to Know Not to Be an Idiot",
      synopsis:
        "A collection of Olavo de Carvalho's newspaper columns from two decades, on culture, politics, education and Brazilian intellectual life.",
    },
  },
  {
    title: "O Capital",
    en: {
      title: "Capital",
      synopsis:
        "Karl Marx's central work analyses how capitalism works: the commodity, labour, surplus value and the accumulation of capital. One of the most influential, and most debated, books of modern economics and politics.",
    },
  },
  {
    title: "O Fim da Infância",
    en: {
      title: "Childhood's End",
      synopsis:
        "Vast alien ships appear over the world's major cities, and their occupants, the Overlords, put an end to war and hunger. But nobody knows what they want. A science fiction classic by Arthur C. Clarke.",
    },
  },
  {
    title: "Outliers",
    en: {
      synopsis:
        "Malcolm Gladwell looks at what lies behind people who stand far outside the norm, from the Beatles to Bill Gates, and shows how timing, culture, opportunity and the famous ten thousand hours of practice weigh as much as talent.",
    },
  },
  {
    title: "A Revolução dos Bichos",
    en: {
      title: "Animal Farm",
      synopsis:
        "Tired of being exploited, the animals of Manor Farm drive out the farmer and start governing themselves under the motto that all animals are equal. George Orwell's fable about what happens to revolutions after they win.",
      notes: `- The animals drive out the human to end exploitation, and in the end the pigs become the human
- "All animals are equal, but some animals are more equal than others"
- The **seven commandments** get rewritten little by little, and nobody remembers the original version
- **Squealer** is the propaganda: he convinces everyone that the worst is the best
- **Boxer**: the loyal, hard-working horse ("I will work harder"), used until he is of no more use
- **Snowball** becomes the enemy blamed for everything after he is driven out
- **Napoleon** uses the dogs (force) to seize power
- Benjamin, the donkey, sees everything and does nothing
- The sheep repeat slogans and drown out any discussion
- The other animals' lack of education and memory is what makes the tyranny possible
- A direct parallel with the Russian revolution and Stalinism`,
    },
  },
  {
    title: "Never Split the Difference",
    pt: {
      title: "Negocie como se Sua Vida Dependesse Disso",
      synopsis:
        'O ex-negociador de reféns do FBI Chris Voss transforma lições de sequestros e impasses num manual de negociação para o dia a dia: empatia tática, espelhamento, nomear emoções e chegar ao "é isso mesmo".',
    },
  },
];

