// Content for each book's page, matched to books.json by title.
// `notes` from the owner's Notion "Livros" database; `notesGenerated: true` marks notes drafted
// in the same style for read books whose Notion page was blank (edit them in the backoffice).
// `readUrl` is only ever a public-domain edition.

export type BookPage = {
  title: string;
  synopsis: string;
  notes?: string;
  notesGenerated?: boolean;
  readUrl?: string;
};

export const bookPages: BookPage[] = [
  {
    title: "Contos",
    synopsis:
      "Uma seleção dos contos mais conhecidos de Edgar Allan Poe, o mestre do horror psicológico e o inventor do conto policial. Narradores pouco confiáveis, casas que parecem vivas e enigmas resolvidos pela pura lógica.",
    readUrl: "https://www.gutenberg.org/ebooks/2147",
    notes: `### 1. **O Gato Preto** (*The Black Cat*)

*"A culpa e o alcoolismo transformam um homem em assassino, mas o miado de um gato selado na parede revela seu crime."*

### 2. **O Coração Denunciador** (*The Tell-Tale Heart*)

*"Um assassino tenta provar sua sanidade, mas o som de um coração imaginário o faz confessar."*

### 3. **A Queda da Casa de Usher** (*The Fall of the House of Usher*)

*"A decadência física e mental da família Usher culmina no colapso literal da mansão."*

### 4. **O Barril de Amontillado** (*The Cask of Amontillado*)

*"Montresor atrai Fortunato para as catacumbas e o sepulta vivo em busca de vingança."*

### 5. **Berenice**

*"A obsessão dental leva Egaeus a roubar os dentes de sua noiva, que ainda estava viva."*

### 6. **O Poço e o Pêndulo** (*The Pit and the Pendulum*)

*"Entre lâminas mortais e um abismo sem fim, a salvação chega nos últimos segundos."*

### 7. **A Máscara da Morte Rubra** (*The Masque of the Red Death*)

*"Nenhuma muralha protege o príncipe Próspero e seus convidados da própria Morte."*

### 8. **William Wilson**

*"Ao tentar matar seu doppelgänger, William descobre que destruiu a si mesmo."*

### 9. **O Escaravelho de Ouro** (*The Gold-Bug*)

*"Um enigma criptografado leva a um tesouro pirata enterrado."*

### 10. **A Carta Roubada** (*The Purloined Letter*)

*"O detetive Dupin encontra uma carta valiosa onde ninguém esperava: à vista de todos."*

### 11. **O Retrato Oval** (*The Oval Portrait*)

*"A beleza da arte suga a vida da modelo, fundindo a realidade e a pintura."*

### 12. **Ligeia**

*"A misteriosa Ligeia parece ressuscitar, tomando o corpo da nova esposa do narrador."*

### 13. **O Homem da Multidão** (*The Man of the Crowd*)

*"Um homem segue um estranho sem destino pela cidade, encontrando apenas o vazio."*

### 14. **A Verdade Sobre o Caso do Sr. Valdemar** (*The Facts in the Case of M. Valdemar*)

*"Um moribundo hipnotizado antes da morte permanece entre a vida e a decomposição."*

### 15. **Morella**

*"A esposa morre, mas sua alma parece renascer na filha, trazendo horror ao pai."*`,
  },
  {
    title: "A Sutil Arte de Ligar o Foda-se",
    synopsis:
      "Mark Manson vai contra a autoajuda do pensamento positivo: em vez de tentar se importar com tudo, a vida melhora quando você escolhe com cuidado as poucas coisas que realmente merecem a sua energia.",
    notesGenerated: true,
    notes: `- Não dá para se importar com tudo, a energia é limitada. A questão é **escolher com o que se importar**
- Querer uma experiência positiva o tempo todo já é uma experiência negativa (**lei do esforço reverso**)
- A dor faz parte. Felicidade vem de **resolver problemas**, não de não tê-los
- Que dor você está disposto a sentir? O que você quer é definido pelo sacrifício que aceita fazer
- Você não é especial. Aceitar isso tira o peso de ter que ser extraordinário o tempo todo
- **Valores ruins**: prazer, sucesso material, sempre estar certo, ser positivo sempre
- **Valores bons**: honestidade, responsabilidade, humildade, curiosidade
- Culpa e responsabilidade são coisas diferentes. Nem tudo é culpa sua, mas tudo o que acontece com você é responsabilidade sua
- Desconfie das próprias certezas, a gente está errado sobre muita coisa
- Saber dizer não é o que dá valor ao sim
- Pensar na morte ajuda a colocar o resto em perspectiva`,
  },
  {
    title: "Inabalável",
    synopsis:
      "Tony Robbins entrevistou grandes nomes do mercado financeiro para montar um guia prático de independência financeira: como funcionam as taxas, os juros compostos e a alocação de ativos, e como montar uma carteira que aguente qualquer cenário.",
    notesGenerated: true,
    notes: `- **Juros compostos** são a força mais importante: começar cedo vale mais que começar com muito
- Taxas pequenas destroem o patrimônio no longo prazo. Sempre olhar quanto se paga de taxa
- Ninguém consegue prever o mercado de forma consistente, nem os profissionais
- **Fundos de índice** de baixo custo batem a maioria dos fundos ativos
- **Alocação de ativos** é a decisão mais importante: dividir entre segurança e crescimento
- Rebalancear a carteira periodicamente
- Crises e quedas fazem parte do ciclo, não são o fim. Quem não vende no pânico se recupera
- **Carteira para todas as estações** (Ray Dalio): montar algo que aguente inflação, deflação, crescimento e recessão
- Ter uma reserva de emergência antes de assumir risco
- Definir um número: quanto é preciso para ser livre financeiramente
- Automatizar os aportes para não depender de força de vontade`,
  },
  {
    title: "A Arte da Guerra",
    synopsis:
      "O tratado militar chinês atribuído a Sun Tzu, escrito há mais de dois mil anos. Treze capítulos curtos sobre estratégia, planejamento e conhecimento do terreno, que até hoje são lidos como lições de liderança e negócios.",
    readUrl: "https://www.gutenberg.org/ebooks/132",
    notesGenerated: true,
    notes: `- "Conheça o inimigo e conheça a si mesmo, e você não temerá o resultado de cem batalhas"
- A **suprema arte da guerra** é vencer sem lutar
- Toda guerra é baseada no **engano**: quando for capaz, finja ser incapaz
- A vitória é decidida antes da batalha, no **planejamento**
- Os cinco fatores: caminho (moral), clima, terreno, comando e disciplina
- Guerras longas desgastam até quem vence. Rapidez importa
- Atacar onde o inimigo não está preparado, aparecer onde não é esperado
- Ser como a água: se adaptar à forma do terreno
- Nunca encurralar totalmente o inimigo, deixe uma saída
- O bom general cria a situação certa em vez de depender dos soldados
- Saber quando lutar e quando não lutar`,
  },
  {
    title: "Hamlet",
    synopsis:
      "O príncipe da Dinamarca recebe a visita do fantasma do pai, que lhe revela um crime e exige vingança. Dividido entre a dúvida e o dever, Hamlet finge a loucura enquanto a corte de Elsinore se enche de desconfiança.",
    readUrl: "https://www.gutenberg.org/ebooks/1524",
    notesGenerated: true,
    notes: `- **Ser ou não ser**: a dúvida paralisa mais do que o medo
- Hamlet pensa demais e age de menos, e a demora custa caro a todos
- A loucura fingida serve de máscara para dizer verdades
- **A peça dentro da peça**: usar a arte para revelar a culpa ("the play's the thing")
- Polônio: "sê fiel a ti mesmo", conselho bom dito por alguém que não o segue
- A corrupção no topo contamina todo o reino ("há algo de podre no reino da Dinamarca")
- Ofélia é a maior vítima do jogo dos outros
- Vingança gera mais vingança: no final, quase ninguém sobra
- A caveira de Yorick: todos acabam iguais diante da morte
- "O resto é silêncio"`,
  },
  {
    title: "O Pequeno Príncipe",
    synopsis:
      "Um aviador cai no deserto do Saara e conhece um pequeno príncipe vindo de um asteroide distante. Entre desenhos de carneiros e histórias de planetas estranhos, uma fábula sobre amizade, amor e o olhar das crianças sobre o mundo dos adultos.",
    notesGenerated: true,
    notes: `- "O essencial é invisível aos olhos, só se vê bem com o coração"
- "Tu te tornas eternamente responsável por aquilo que cativas"
- Os adultos só entendem números, esqueceram como é ser criança
- **A rosa**: o que a torna única é o tempo que se dedicou a ela
- **A raposa**: cativar é criar laços, e criar laços é se arriscar a sofrer
- Cada planeta é um tipo de adulto: o rei, o vaidoso, o bêbado, o empresário, o acendedor de lampiões, o geógrafo
- O empresário conta estrelas para possuí-las, mas não aproveita nenhuma
- Os baobás: problemas pequenos têm que ser arrancados cedo, antes de crescerem
- É preciso suportar duas ou três larvas se quiser conhecer as borboletas
- O deserto é bonito porque esconde um poço em algum lugar`,
  },
  {
    title: "1984",
    synopsis:
      "Em um superestado totalitário vigiado pelo Grande Irmão, Winston Smith trabalha reescrevendo a história para o Partido. Quando ele começa a duvidar e a guardar pensamentos proibidos, descobre o preço de querer ser livre.",
    notesGenerated: true,
    notes: `regra do partido

controlar o passado é controlar o futuro

.ministério da verdade reescreve a história

.quem controla a memória controla a realidade

novilíngua

reduzir as palavras para reduzir o pensamento

.sem palavra para rebelião, não existe rebelião

.duplipensar: aceitar duas ideias contraditórias ao mesmo tempo

vigilância

o grande irmão está de olho em você

.teletela em todo lugar

.medo constante gera obediência

.crianças denunciando os pais

ódio

dois minutos de ódio

.um inimigo externo une as pessoas

.guerra permanente mantém a ordem

o fim

.liberdade é poder dizer que 2 + 2 = 4

.o partido não quer obediência, quer que você ame o grande irmão

.quarto 101: o medo de cada um usado contra ele`,
  },
  {
    title: "Mente Milionária",
    synopsis:
      "T. Harv Eker defende que a relação com o dinheiro é programada desde a infância, e que esse \"modelo financeiro\" interno determina os resultados. O livro compara o jeito de pensar de ricos e pobres e propõe exercícios para reprogramar essa mentalidade.",
  },
  {
    title: "Pai Rico, Pai Pobre",
    synopsis:
      "Robert Kiyosaki conta o que aprendeu sobre dinheiro com dois pais: o seu, educado e com bom emprego, e o pai de um amigo, empresário sem diploma. A diferença entre ativos e passivos é o ponto de partida para repensar trabalho, dívidas e investimentos.",
    notes: `- Tenho de aprender a poupar dinheiro e nao gastar tudo o que recebo
- Antes de comprar alguma coisa, devo pensar se preciso mesmo dela
- Quero aprender a investir para fazer o meu dinheiro crescer
- Nao devo depender apenas de um salario, posso procurar outras formas de ganhar dinheiro
- Tenho de aprender mais sobre dinheiro para tomar melhores decisoes
- O mais importante nao e ganhar muito dinheiro, mas saber usa-lo bem
- Quero comecar a pensar mais no meu futuro e nao apenas no que posso comprar hoje
- Devo evitar gastar dinheiro so para impressionar os outros
- E importante ter objetivos financeiros e trabalhar para os alcancar
- Quero aprender a distinguir aquilo que me da dinheiro daquilo que me faz gastar dinheiro
- Devo ter cuidado com as dividas e evitar pedir dinheiro sem necessidade
- Em vez de gastar tudo em coisas que perdem valor, devo pensar em investir no meu futuro
- Tenho de perceber que ficar rico nao acontece de um dia para o outro
- Devo aproveitar o meu tempo para aprender coisas que me possam ajudar a ganhar mais dinheiro
- Nao devo ter medo de aprender coisas novas sobre investimentos
- Quero deixar de trabalhar apenas para pagar contas e comecar a construir uma vida com mais liberdade financeira
- Devo ter paciencia, porque os resultados levam tempo
- E importante aprender com os meus erros e nao desistir quando alguma coisa corre mal
- Quero tomar melhores decisoes com o dinheiro que tenho, mesmo que seja pouco
- A minha mentalidade sobre o dinheiro pode fazer muita diferenca no meu futuro`,
  },
  {
    title: "As 16 Leis do Sucesso",
    synopsis:
      "Fruto de anos de entrevistas com empresários do início do século XX, o curso de Napoleon Hill organiza em dezesseis lições os hábitos que, segundo ele, separam quem realiza de quem só deseja: propósito definido, autoconfiança, iniciativa e persistência.",
    notesGenerated: true,
    notes: `- **Mente mestra**: juntar pessoas com um mesmo objetivo multiplica a capacidade de cada um
- **Objetivo principal definido**: sem um alvo claro, todo esforço se dispersa
- **Autoconfiança** se constrói, não se nasce com ela
- **Hábito de poupar**: guardar parte do que se ganha dá liberdade de escolha
- **Iniciativa e liderança**: fazer sem precisar que mandem
- **Imaginação**: toda conquista começa como uma ideia
- **Entusiasmo** contagia e move as pessoas ao redor
- **Autocontrole**: quem não controla a si mesmo não controla nada
- **Fazer mais do que é pago para fazer**
- **Personalidade agradável** abre mais portas que talento
- **Pensamento preciso**: separar fatos de opiniões
- **Concentração** em uma coisa de cada vez
- **Cooperação** em vez de competição
- **Aproveitar o fracasso**: toda derrota traz a semente de uma vantagem equivalente
- **Tolerância** com quem pensa diferente
- **Regra de ouro**: tratar os outros como gostaria de ser tratado`,
  },
  {
    title: "Percy Jackson (coleção)",
    synopsis:
      "Percy é um garoto de doze anos com dislexia e déficit de atenção que vive se metendo em encrenca, até descobrir que é filho de um deus grego. No Acampamento Meio-Sangue, ele parte em missões pelos Estados Unidos, onde os monstros e deuses do Olimpo continuam bem vivos.",
    notesGenerated: true,
    notes: `- O que parecia defeito (dislexia, TDAH) era sinal de outra natureza: o cérebro feito para o grego antigo e o instinto de batalha
- **Lealdade** é a grande força e também a grande fraqueza do Percy
- Os deuses são poderosos, mas falhos, egoístas e ausentes como pais
- A mitologia grega recontada no mundo moderno: o Olimpo no Empire State, o Mundo Inferior em Los Angeles
- Annabeth: inteligência e planejamento valem tanto quanto força
- Grover: coragem não é não ter medo
- Luke mostra como o ressentimento com os pais pode ser usado por alguém pior
- **Profecias** se cumprem, mas nunca do jeito que se espera
- Os semideuses não reconhecidos: ser ignorado machuca mais que ser odiado
- Escolhas importam mais que origem`,
  },
  {
    title: "Diário de um Banana",
    synopsis:
      "Greg Heffley começa o ensino fundamental registrando no diário (que ele insiste em chamar de \"agenda\") seus planos para ficar popular. Ilustrado com os rabiscos do próprio Greg, é uma comédia sobre a escola, a família e o melhor amigo que não liga para nada disso.",
    notesGenerated: true,
    notes: `- Greg quer ser popular a qualquer custo, e quase sempre o plano dá errado
- Rowley é o oposto: não tenta ser legal e por isso acaba sendo
- **O queijo**: a regra da escola que ninguém questiona e todo mundo teme
- Os irmãos: Rodrick atormenta, Manny é protegido pelos pais
- Greg quase nunca assume a culpa pelos próprios erros
- O humor vem de mostrar o egoísmo de forma honesta
- Amizade vale mais que status
- As ilustrações contam metade da história`,
  },
  {
    title: "Steve Jobs",
    synopsis:
      "A biografia autorizada de Steve Jobs, escrita por Walter Isaacson a partir de mais de quarenta entrevistas com ele e com amigos, familiares, rivais e colegas. Da garagem em Los Altos ao iPhone, o retrato de um gênio difícil que mudou várias indústrias.",
    notesGenerated: true,
    notes: `- **Campo de distorção da realidade**: fazer as pessoas acreditarem que o impossível é possível
- Foco é dizer não para mil boas ideias
- **Simplicidade** é a sofisticação máxima
- Integração de ponta a ponta: hardware e software juntos, controlando a experiência inteira
- Atenção aos detalhes até onde ninguém vê (a parte de dentro do Mac)
- Os produtos certos nascem na interseção entre **tecnologia e humanidades**
- Ser demitido da Apple foi o melhor que aconteceu: NeXT e Pixar
- Contratar só jogadores de nível A, eles atraem outros A
- O lado ruim: grosseria, controle e dificuldade em lidar com as pessoas
- As pessoas não sabem o que querem até você mostrar a elas
- Pensar diferente: "os loucos que pensam que podem mudar o mundo são os que o mudam"`,
  },
  {
    title: "As 48 Leis do Poder",
    synopsis:
      "Robert Greene reúne três mil anos de história, de cortes reais a golpistas, em 48 leis sobre como o poder é conquistado, mantido e perdido. Um manual frio e cheio de exemplos, tão útil para usar quanto para se defender.",
    notesGenerated: true,
    notes: `- **Lei 1**: nunca ofusque o mestre
- **Lei 3**: oculte suas intenções
- **Lei 4**: diga sempre menos do que o necessário
- **Lei 5**: a reputação é a base do poder, proteja-a
- **Lei 6**: chame atenção a qualquer preço
- **Lei 9**: vença pelas ações, não pela discussão
- **Lei 15**: aniquile totalmente o inimigo
- **Lei 16**: use a ausência para aumentar o respeito
- **Lei 18**: não se isole, o isolamento é perigoso
- **Lei 25**: recrie-se
- **Lei 28**: seja ousado
- **Lei 29**: planeje até o fim
- **Lei 30**: faça parecer fácil
- **Lei 33**: descubra o ponto fraco de cada um
- **Lei 38**: pense como quiser, mas comporte-se como os outros
- **Lei 48**: seja como a água, sem forma

.ler como defesa: entender o jogo para não ser usado nele`,
  },
  {
    title: "The Champion's Mind",
    synopsis:
      "Sports psychologist Jim Afremow draws on his work with Olympians and professional athletes to show how champions think: building confidence, staying focused under pressure, bouncing back from setbacks and keeping the routines that make peak performance repeatable.",
    notes: `- **Mental Toughness**:
  - Michael Phelps' example despite early career struggles and injuries
  - Used challenges as fuel for success, maintaining a positive mindset under pressure
  - Mental toughness is built through overcoming adversity and staying positive
  - Practicing "mental resets" during setbacks, focusing on the next task, not the mistake
- **Visualization**:
  - Mental rehearsal helps her stay prepared and confident during competition
  - Visualization isn't just imagining success… it's about mentally rehearsing every scenario
  - Practicing "positive mental imagery" regularly imagining success, but also visualizing how to handle adversity and unexpected situations
- **Confidence**:
  - Kobe Bryant built confidence through years of preparation not just natural talent
  - Confidence comes from consistent preparation and trusting your abilities
  - Affirmations and visualization to reinforce confidence. Affirmations, especially when paired with physical preparation, help solidify self-belief
- **Focus**:
  - Tiger Woods blocks out all distractions, staying fully immersed in the present moment during tournaments
  - Practices mental focus to avoid mistakes and remain calm under pressure
  - Staying focused on the task at hand and blocking out distractions is essential for peak performance
  - **Focus drills**, where athletes practice staying in the present moment, such as focusing only on one thing for a set time or completing tasks in intervals to train concentration
- **Motivation**:
  - Usain Bolt's motivation was driven by a desire to break records and continuously improve
  - Motivation should come from the desire to push your limits and improve, not just from winning against others but comparing you today from you yesterday
  - Set **personal performance goals** rather than just external ones.
- **Routine and Consistency**:
  - Serena Williams maintains a strict daily routine with specific warm-ups, exercises, and mental drills
  - Consistency in training was key to her long-term success
  - Success isn't just about talent; it's about maintaining a consistent routine over time
  - Build routines that include both physical training and mental exercises, making them part of their daily life rather than only training during designated sessions`,
  },
  {
    title: "12 Regras para a Vida",
    synopsis:
      "O psicólogo Jordan Peterson combina mitologia, neurociência, religião e casos clínicos em doze regras para encontrar ordem e sentido em meio ao caos da vida, da postura do corpo à forma de falar com as pessoas.",
    notes: `### regra 1

costas eretas, ombros para trás

- lagostas
- cérebro primitivo
- serotonina
- hierarquia de dominância
- confronte a incerteza do mundo voluntariamente, com fé e coragem

### regra 2

cuide de si mesmo como cuidaria de alguém sob sua responsabilidade

- não tomar o remédio
- caos e ordem
- de sentido à vida
- fortaleça o individual

### regra 3

seja amigo de pessoas que queiram o melhor para você

- drogas
- use senso crítico
- media dos 5

### regra 4

compare a si mesmo com quem você foi ontem, não com quem outra pessoa é hoje

- domar o crítico interno
- voce é tirano ou negocia com si mesmo?
- reduza o espectro do olhar
- ache a real razão do pensamento

### regra 5

não deixe que seus filhos façam algo que faça você deixar de gostar deles

- crianças mal criadas
- use sabiamente da violência

### regra 6

deixe sua casa em perfeita ordem antes de criticar o mundo

- serial killers
- comece pequeno
- seja racional
- não enfeite o que não precisa (primitividade)

### regra 7

busque o que é significativo, não o que é conveniente

- não troque o presente pelo futuro
- adão e eva
- significado > momento

### regra 8

diga a verdade. ou, pelo menos, não minta

- verdade é o princípio da ordem
- manipulações vem da inverdade
- não se deixe iludir por mentiras internas, busque a essência

### regra 9

presuma que a pessoa com quem está conversando possa saber algo que você não sabe

- seja genuíno nas conversas (sem o filtro social)
- descubra por si mesmo
- escutar tem outro significado (sem julgar)

### regra 10

seja preciso no que diz

- seja preciso nas suas ideias para não se afogar na complexidade do mundo
- nunca subestime o poder destrutivo dos pecados da omissão
- trabalhe com a realidade, sem fazer suposições e afirmações sem exatidão
- confronte o caos com a exatidão do ser

### regra 11

não incomode as crianças quando estão andando de skate

- perigo (viver no limite) gera progresso
- não limite os outros, isso pode prejudicar toda a sua evolução
- não se deve acreditar nos "autoproclamados juizes da raça humana"
- patriarcado: tem mais coisas boas do que se imagina
- ideias tem consequências (marx)
- diferenças entre homens e mulheres são naturais
- não seja insuficientemente agressivo, às vezes é necessário se impor

### regra 12

acaricie um gato ao encontrar um na rua

- aceite que o SER tem seus sofrimentos e suas limitações, sem isso ele não seria SER
- tire algum momento do seu dia para reestabelecer a força do seus propósitos, seja fazendo algo que gosta ou apenas não fazendo o esperado`,
  },
  {
    title: "The Obstacle Is the Way",
    synopsis:
      "Drawing on Marcus Aurelius and the Stoics, Ryan Holiday shows how history's great figures turned the problems in front of them into the path forward, through the discipline of perception, action and will.",
    notes: `The book is inspired by **Stoic philosophy** and explains that **setbacks, frustration, fear and failure are not interruptions to your life — they are the raw material for progress**.

Instead of asking

> "How do I get rid of this problem?"
>
> the book teaches you to ask
>
> "How can I use this problem?"

The whole mindset is organized into a very practical framework:

### 1. Perception

You learn to:

- stop exaggerating problems in your head
- separate facts from emotions
- reframe obstacles as neutral events

In practice: most suffering comes not from what happens, but from how you interpret it.

### 2. Action

You learn to:

- focus only on what is controllable
- break obstacles into small, executable steps
- act even when conditions are not perfect

The book strongly pushes the idea that **waiting for clarity or confidence is a trap** — clarity comes from doing.

### 3. Will

You learn to:

- accept what you cannot change
- remain steady under pressure
- use hardship to build emotional endurance

This part is about long-term resilience, not short-term motivation.

---

Obstacles are not only challenges to overcome —

they are **the exact training ground that develops your skills, character and leverage**.

In short:

> The thing you want to avoid is usually the thing that makes you better, stronger and more capable.`,
  },
  {
    title: "O Homem do Castelo Alto",
    synopsis:
      "Nos Estados Unidos de 1962, quem venceu a Segunda Guerra foram o Eixo: o país está dividido entre a Alemanha nazista e o Japão. Entre comerciantes, espiões e um romance proibido que imagina outro desfecho para a guerra, Philip K. Dick questiona o que é real.",
  },
  {
    title: "Roube como um Artista",
    synopsis:
      "Um manifesto curto e ilustrado de Austin Kleon sobre criatividade na era digital: nada é original, toda obra nasce de influências, e o segredo está em copiar bem, misturar referências e mostrar o próprio trabalho.",
  },
  {
    title: "The Hard Thing About Hard Things",
    synopsis:
      "Ben Horowitz, co-founder of Andreessen Horowitz, skips the startup cheerleading and writes about the parts nobody prepares you for: layoffs, firing friends, near-bankruptcy and the lonely job of being the CEO when there is no easy answer.",
  },
  {
    title: "A Revolta de Atlas",
    synopsis:
      "Em uns Estados Unidos em decadência, os industriais e inventores mais brilhantes estão desaparecendo um a um. Dagny Taggart tenta salvar a ferrovia da família enquanto procura entender quem está por trás disso. O romance que resume a filosofia de Ayn Rand.",
  },
  {
    title: "Iludidos pelo Acaso",
    synopsis:
      "Nassim Taleb, ex-trader e matemático, mostra como confundimos sorte com habilidade, especialmente nos mercados. O primeiro livro da série que deu origem a \"A Lógica do Cisne Negro\", sobre como o acaso molda resultados muito mais do que admitimos.",
    notesGenerated: true,
    notes: `- Confundimos **sorte com habilidade**, principalmente quando o resultado é bom
- **Viés de sobrevivência**: só vemos os traders que deram certo, não os milhares que quebraram
- **Histórias alternativas**: julgar uma decisão pelo que poderia ter acontecido, não só pelo que aconteceu
- A roleta-russa: ganhar 10 milhões com 1 chance em 6 de morrer não é uma boa decisão, mesmo que você ganhe
- Quanto mais você olha para os resultados, mais ruído e menos sinal enxerga
- **Eventos raros** são subestimados até acontecerem
- O problema da indução: mil cisnes brancos não provam que não existe cisne negro
- Falsificar é mais útil que confirmar (Popper)
- Ser **cético** com as próprias teorias
- Assimetria: o que importa é o tamanho do ganho ou da perda, não só a probabilidade`,
  },
  {
    title: "O Andar do Bêbado",
    synopsis:
      "O físico Leonard Mlodinow conta a história da probabilidade, de Cardano a Bayes, para mostrar como o acaso governa muito mais da nossa vida (carreira, investimentos, esportes) do que estamos dispostos a admitir.",
    notes: `- O hemisfério direito do cérebro está mais ligado ao instinto primitivo, enquanto o hemisfério esquerdo é mais ligado ao racional.
- Para aumentar a chance de vencer a aleatoriedade devemos utilizar da repetição.
- **Erro de viés de disponibilidade**: quando usamos como base nossas memórias mais vividas para tomar uma decisão (i.e. elas são mais "disponíveis para nós"). Não necessariamente o que nós mais vivemos reflete a realidade.
- **Lei da combinação de probabilidades**: evento A e evento B são independentes (SEM relação entre si), logo a probabilidade dos 2 ocorrerem é o produto de A\\*B. Se quisermos a probabilidade de A ou B, somamos A + B.
- Girolamo Cardano foi um dos pais da teoria da probabilidade.
- **Regra de Cardano**: em um processo aleatório, a probabilidade de algo ocorrer é sua proporção perante todas as outras possíveis saídas. Todas essas saídas somadas são chamadas espaço amostral.
- Resultados de curto prazo são extremamente falhos para comprovar habilidade.
- Qualquer dispositivo artificial está fadado a ser tendencioso (como um dado), pois o ser humano não tem acesso a perfeição.
- "O caos completo é, ironicamente, um tipo de perfeição".
- **Teoria dos Grandes Números (teorema de Bernoulli)**: os resultados refletem as probabilidades subjacentes quando executados em larga escala.
- **Teoria dos Pequenos Números**: uma amostra pequena provavelmente não reflete as probabilidades subjacentes.
- Não deveríamos avaliar as ações humanas com base no resultado, mas nas suas habilidades (análise fundamentalista).
- Um evento **NÃO** tem mais ou menos chance de acontecer por já ter acontecido recentemente.
- Existe uma diferença entre a chance de que vários eventos ocorram porque são fruto de algo, da chance de que algo ocorra porque é fruto de vários eventos (teorias da conspiração).
- Segundo a teoria de Bayes, a probabilidade de A ocorrer se B ocorrer geralmente é diferente da probabilidade de B ocorrer se A ocorrer.
- Medições sempre trazem consigo incertezas.
- Uma curva normal de desvio padrão (i.e. distribuição normal, lei do erros) é uma característica de um processo aleatório.
- Boa parte da ordem que encontramos na natureza esconde uma desordem subjacente.
- O ser humano não consegue entender a aleatoriedade.
- Na vida real, temos certa ilusão de controle, mas o acaso determina muito mais do que percebemos.
- **Viés da confirmação**: sempre tentamos provar que nossas ideias estão certas, nunca erradas.
- Noções pré concebidas podem levar a acreditarmos que um padrão não é aleatório, mesmo que seja.
- Devemos dar mais importância a nossa impressão sobre alguém, do que seus resultados.
- Subestimamos o acaso tanto na vida de pessoas bem sucedidas quanto nas mau sucedidas.

Primeira lei da probabilidade: A probabilidade de que 2 eventos nunca podem ocorrer com maior probabilidade de que a probabilidade que cada evento ocorra individualmente.`,
  },
  {
    title: "Como me Tornei Estúpido",
    synopsis:
      "Antoine tem 25 anos, é inteligente demais e infeliz por isso. Cansado de pensar, ele decide se tornar estúpido e tenta de tudo, do alcoolismo ao mercado financeiro. Uma sátira curta e afiada de Martin Page sobre conformismo.",
  },
  {
    title: "Eram os Deuses Astronautas?",
    synopsis:
      "O best-seller de 1968 em que Erich von Däniken sugere que monumentos antigos, como as pirâmides e as linhas de Nazca, seriam vestígios de visitas extraterrestres. Uma das obras mais populares e mais contestadas da pseudoarqueologia.",
  },
  {
    title: "Leonardo da Vinci",
    synopsis:
      "Walter Isaacson se baseia nas milhares de páginas dos cadernos de Leonardo para retratar o homem por trás da Mona Lisa: um curioso incansável que ligava arte, anatomia, engenharia e observação da natureza.",
  },
  {
    title: "Crime e Castigo",
    synopsis:
      "Raskólnikov, um ex-estudante miserável em São Petersburgo, convence-se de que certos homens extraordinários têm o direito de transgredir a moral. Dostoiévski acompanha o que acontece na mente dele quando decide pôr a teoria à prova.",
    readUrl: "https://www.gutenberg.org/ebooks/2554",
  },
  {
    title: "Armas, Germes e Aço",
    synopsis:
      "Por que foram os europeus que conquistaram as Américas, e não o contrário? Jared Diamond responde com geografia, agricultura, domesticação de animais e doenças, num livro que venceu o Pulitzer ao reler 13 mil anos de história humana.",
  },
  {
    title: "O Homem e seus Símbolos",
    synopsis:
      "O último projeto de Carl Jung, pensado para o público leigo: uma introdução ilustrada ao inconsciente, aos sonhos, aos arquétipos e aos símbolos que se repetem em mitos, religiões e na arte.",
  },
  {
    title: "A Metamorfose",
    synopsis:
      "Certa manhã, Gregor Samsa acorda transformado em um inseto monstruoso. A novela de Kafka acompanha a reação dele e da família, que depende do seu salário, numa das histórias mais estranhas e marcantes da literatura.",
    readUrl: "https://www.gutenberg.org/ebooks/5200",
  },
  {
    title: "Como Fazer Amigos e Influenciar Pessoas",
    synopsis:
      "O clássico de 1936 de Dale Carnegie sobre relações humanas: princípios simples (se interessar pelos outros, lembrar nomes, evitar críticas) para criar conexões, convencer sem brigar e liderar sem gerar ressentimento.",
  },
  {
    title: "O Quarto Reich",
    synopsis: "",
  },
  {
    title: "Sociedade do Cansaço",
    synopsis:
      "Um ensaio curto do filósofo Byung-Chul Han: deixamos a sociedade disciplinar das proibições e entramos na sociedade do desempenho, em que cada um explora a si mesmo até o esgotamento, a depressão e o burnout.",
  },
  {
    title: "O Príncipe",
    synopsis:
      "Escrito em 1513 por Nicolau Maquiavel, um manual direto sobre como conquistar e manter o poder, baseado em como os governantes realmente agem, e não em como deveriam agir. O texto que deu origem ao adjetivo \"maquiavélico\".",
    readUrl: "https://www.gutenberg.org/ebooks/1232",
  },
  {
    title: "Dedique-se de Coração",
    synopsis:
      "Howard Schultz conta como transformou uma pequena loja de grãos de café em Seattle na Starbucks, e como tentou construir uma empresa grande sem perder os valores, o cuidado com os funcionários e a experiência do cliente.",
  },
  {
    title: "Uma Breve História do Tempo",
    synopsis:
      "Stephen Hawking explica para leigos as grandes questões da cosmologia: o Big Bang, os buracos negros, a natureza do tempo e a busca por uma teoria que unifique a física. Um dos livros de divulgação científica mais vendidos de todos os tempos.",
  },
  {
    title: "101 Perguntas e Respostas para Investidores Iniciantes",
    synopsis:
      "Um guia em formato de perguntas e respostas para quem está começando a investir: renda fixa, ações, fundos, riscos e os primeiros passos para organizar as finanças.",
  },
  {
    title: "Mais Esperto que o Diabo",
    synopsis:
      "Escrito em 1938 e guardado pela família de Napoleon Hill por mais de setenta anos, o livro é uma entrevista imaginária com o Diabo, que revela como mantém as pessoas presas ao medo, à indecisão e ao hábito de \"ficar à deriva\".",
  },
  {
    title: "A Marca da Vitória",
    synopsis:
      "As memórias de Phil Knight, fundador da Nike: de vender tênis japoneses no porta-malas do carro até criar uma das marcas mais conhecidas do mundo, com todas as dívidas, brigas e quase falências do caminho.",
  },
  {
    title: "Meditações",
    synopsis:
      "Os cadernos pessoais do imperador romano Marco Aurélio, escritos para si mesmo durante campanhas militares. Reflexões estoicas sobre o dever, a morte, a natureza e o controle das próprias reações.",
    readUrl: "https://www.gutenberg.org/ebooks/2680",
  },
  {
    title: "Sobre a Brevidade da Vida",
    synopsis:
      "Numa carta a seu amigo Paulino, Sêneca argumenta que a vida não é curta, nós é que a desperdiçamos. Um texto estoico curto sobre o tempo, a ocupação inútil e a arte de viver no presente.",
  },
  {
    title: "O Momento Decisivo",
    synopsis:
      "Jonah Lehrer usa a neurociência para explicar como o cérebro decide, de pilotos e jogadores de pôquer a quarterbacks, e quando vale a pena confiar na emoção ou na razão.",
  },
  {
    title: "A Insustentável Leveza do Ser",
    synopsis:
      "Praga, 1968. As vidas de Tomas, Tereza, Sabina e Franz se cruzam durante a Primavera de Praga e a invasão soviética. Milan Kundera mistura romance e filosofia para pensar o peso e a leveza das nossas escolhas.",
  },
  {
    title: "Breves Respostas para Grandes Questões",
    synopsis:
      "O último livro de Stephen Hawking responde a dez grandes perguntas: Deus existe? Como tudo começou? Vamos sobreviver na Terra? A inteligência artificial vai nos superar? Ciência e opinião pessoal de um dos maiores físicos do século.",
  },
  {
    title: "Acredite, Estou Mentindo",
    synopsis:
      "Ryan Holiday, ex-estrategista de marketing, revela como manipulava blogs e a imprensa online para criar notícias do nada, e expõe a economia de cliques que faz a mídia publicar primeiro e checar depois.",
  },
  {
    title: "Predictably Irrational",
    synopsis:
      "Behavioural economist Dan Ariely uses clever experiments to show that our bad decisions aren't random: we overvalue free things, anchor on arbitrary numbers and cheat a little, in ways that are predictable and therefore fixable.",
  },
  {
    title: "Guerra e Paz",
    synopsis:
      "A epopeia de Tolstói acompanha cinco famílias da aristocracia russa durante as guerras napoleônicas, entre bailes em São Petersburgo e campos de batalha como Austerlitz e Borodinó. Um romance sobre história, amor e o sentido da vida.",
    readUrl: "https://www.gutenberg.org/ebooks/2600",
  },
  {
    title: "O Algoritmo Mestre",
    synopsis:
      "Pedro Domingos apresenta as cinco grandes escolas do aprendizado de máquina (simbolistas, conexionistas, evolucionistas, bayesianos e analogistas) e a busca por um único algoritmo capaz de aprender qualquer coisa a partir de dados.",
  },
  {
    title: "O Mínimo que Você Precisa Saber para Não Ser um Idiota",
    synopsis:
      "Uma coletânea de artigos de Olavo de Carvalho publicados na imprensa ao longo de duas décadas, sobre cultura, política, educação e a vida intelectual brasileira.",
  },
  {
    title: "O Capital",
    synopsis:
      "A obra central de Karl Marx analisa o funcionamento do capitalismo: a mercadoria, o trabalho, a mais-valia e a acumulação de capital. Um dos livros mais influentes, e debatidos, da economia e da política modernas.",
  },
  {
    title: "O Fim da Infância",
    synopsis:
      "Imensas naves alienígenas aparecem sobre as principais cidades da Terra, e seus ocupantes, os Senhores Supremos, acabam com as guerras e a fome. Mas ninguém sabe o que eles querem. Um clássico da ficção científica de Arthur C. Clarke.",
  },
  {
    title: "Outliers",
    synopsis:
      "Malcolm Gladwell investiga o que está por trás de pessoas fora da curva, dos Beatles a Bill Gates, e mostra como a época, a cultura, as oportunidades e as famosas dez mil horas de prática pesam tanto quanto o talento.",
  },
  {
    title: "A Revolução dos Bichos",
    synopsis:
      "Cansados da exploração, os animais da Granja do Solar expulsam o fazendeiro e passam a governar a si mesmos sob o lema de que todos são iguais. A fábula de George Orwell sobre o que acontece com as revoluções depois da vitória.",
    notesGenerated: true,
    notes: `- Os animais expulsam o humano para acabar com a exploração, e no fim os porcos viram o próprio humano
- "Todos os animais são iguais, mas alguns são mais iguais que os outros"
- Os **sete mandamentos** vão sendo reescritos aos poucos, e ninguém lembra da versão original
- **Garganta** (Squealer) é a propaganda: convence os outros de que o pior é o melhor
- **Sansão**: trabalhador leal e esforçado ("trabalharei mais"), usado até não servir mais
- **Bola-de-Neve** vira o inimigo culpado de tudo depois de expulso
- **Napoleão** usa os cães (força) para tomar o poder
- Benjamin, o burro, vê tudo e não faz nada
- As ovelhas repetem slogans e abafam qualquer discussão
- A falta de educação e memória dos outros animais é o que permite a tirania
- Paralelo direto com a revolução russa e o stalinismo`,
  },
  {
    title: "Never Split the Difference",
    synopsis:
      "Former FBI hostage negotiator Chris Voss turns lessons from kidnappings and standoffs into a negotiation playbook for everyday life: tactical empathy, mirroring, labelling emotions and getting to \"that's right\".",
  },
];
