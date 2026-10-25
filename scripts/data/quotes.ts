// The best-known line of each read book, applied by the seed only where a book has no quote yet.
// Matched to books.json by base title. Base text is Portuguese like the rest of the book fields,
// `en` goes into the translations. Each English line was checked against the book or a
// verbatim source before it went in; the Portuguese is the line as it is usually quoted in
// Brazilian editions, or a close translation where no edition wording was at hand.

export type BookQuote = {
  title: string;
  quote: string;
  source: string;
  en: { quote: string; quoteSource: string };
};

export const bookQuotes: BookQuote[] = [
  {
    title: "Contos",
    quote:
      "É verdade! Nervoso, terrivelmente nervoso eu andava e ainda ando, mas por que vocês insistem em dizer que eu sou louco?",
    source: "O Coração Denunciador",
    en: {
      quote: "True!—nervous—very, very dreadfully nervous I had been and am; but why will you say that I am mad?",
      quoteSource: "The Tell-Tale Heart",
    },
  },
  {
    title: "A Sutil Arte de Ligar o Foda-se",
    quote:
      "O desejo de ter mais experiências positivas é, em si, uma experiência negativa. E, paradoxalmente, aceitar as experiências negativas é, em si, uma experiência positiva.",
    source: "Capítulo 1",
    en: {
      quote:
        "The desire for more positive experience is itself a negative experience. And, paradoxically, the acceptance of one's negative experience is itself a positive experience.",
      quoteSource: "Chapter 1",
    },
  },
  {
    title: "Inabalável",
    quote: "Ou você domina a sua mente, ou ela domina você.",
    source: "",
    en: { quote: "Either you master your mind or it masters you.", quoteSource: "" },
  },
  {
    title: "A Arte da Guerra",
    quote: "Se você conhece o inimigo e conhece a si mesmo, não precisa temer o resultado de cem batalhas.",
    source: "Capítulo III · O ataque estratégico",
    en: {
      quote: "If you know the enemy and know yourself, you need not fear the result of a hundred battles.",
      quoteSource: "Chapter III · Attack by Stratagem",
    },
  },
  {
    title: "Hamlet",
    quote: "Ser ou não ser, eis a questão.",
    source: "Ato III, Cena 1",
    en: { quote: "To be, or not to be, that is the question.", quoteSource: "Act III, Scene 1" },
  },
  {
    title: "O Pequeno Príncipe",
    quote: "Só se vê bem com o coração. O essencial é invisível aos olhos.",
    source: "Capítulo XXI",
    en: {
      quote: "It is only with the heart that one can see rightly; what is essential is invisible to the eye.",
      quoteSource: "Chapter XXI",
    },
  },
  {
    title: "1984",
    quote: "Quem controla o passado controla o futuro; quem controla o presente controla o passado.",
    source: "Parte I, Capítulo 3",
    en: {
      quote: "Who controls the past controls the future: who controls the present controls the past.",
      quoteSource: "Part One, Chapter 3",
    },
  },
  {
    title: "Pai Rico, Pai Pobre",
    quote: "Os pobres e a classe média trabalham pelo dinheiro. Os ricos fazem o dinheiro trabalhar para eles.",
    source: "Lição 1 · Os ricos não trabalham pelo dinheiro",
    en: {
      quote: "The poor and the middle class work for money. The rich have money work for them.",
      quoteSource: "Lesson 1 · The Rich Don't Work for Money",
    },
  },
  {
    title: "As 16 Leis do Sucesso",
    quote: "Aqueles que ACREDITAM que podem alcançar o seu objetivo principal definido não reconhecem a palavra impossível.",
    source: "Lição 2",
    en: {
      quote: "Those who BELIEVE they can achieve the object of their definite chief aim do not recognize the word impossible.",
      quoteSource: "Lesson Two",
    },
  },
  {
    title: "Percy Jackson (coleção)",
    quote: "Olha, eu não queria ser um meio-sangue.",
    source: "O Ladrão de Raios · Capítulo 1",
    en: { quote: "Look, I didn't want to be a half-blood.", quoteSource: "The Lightning Thief · Chapter 1" },
  },
  {
    title: "Diário de um Banana",
    quote: "Um dia eu vou ser famoso, mas por enquanto estou preso no ensino fundamental com um monte de bobocas.",
    source: "",
    en: {
      quote: "I'll be famous one day, but for now I'm stuck in middle school with a bunch of morons.",
      quoteSource: "",
    },
  },
  {
    title: "Steve Jobs",
    quote: "As pessoas loucas o bastante para achar que podem mudar o mundo são as que de fato mudam.",
    source: "Do anúncio Think Different, citado no livro",
    en: {
      quote: "The people who are crazy enough to think they can change the world are the ones who do.",
      quoteSource: "From the Think Different ad, quoted in the book",
    },
  },
  {
    title: "As 48 Leis do Poder",
    quote: "Faça sempre com que as pessoas acima de você se sintam confortavelmente superiores.",
    source: "Lei 1 · Nunca ofusque o brilho do mestre",
    en: {
      quote: "Always make those above you feel comfortably superior.",
      quoteSource: "Law 1 · Never Outshine the Master",
    },
  },
  {
    title: "The Champion's Mind",
    quote: "Tensão é quem você acha que deveria ser. Relaxamento é quem você é.",
    source: "",
    en: { quote: "Tension is who you think you should be. Relaxation is who you are.", quoteSource: "" },
  },
  {
    title: "12 Regras para a Vida",
    quote: "Trate a si mesmo como alguém que você é responsável por ajudar.",
    source: "Regra 2",
    en: { quote: "Treat yourself like someone you are responsible for helping.", quoteSource: "Rule 2" },
  },
  {
    title: "The Obstacle Is the Way",
    quote: "O impedimento à ação faz a ação avançar. O que fica no caminho se torna o caminho.",
    source: "Marco Aurélio, a epígrafe do livro",
    en: {
      quote: "The impediment to action advances action. What stands in the way becomes the way.",
      quoteSource: "Marcus Aurelius, the book's epigraph",
    },
  },
  {
    title: "Iludidos pelo Acaso",
    quote: "Não importa quão sofisticadas sejam nossas escolhas, quão bons sejamos em dominar as probabilidades, o acaso terá a última palavra.",
    source: "",
    en: {
      quote:
        "No matter how sophisticated our choices, how good we are at dominating the odds, randomness will have the last word.",
      quoteSource: "",
    },
  },
  {
    title: "O Andar do Bêbado",
    quote: "A percepção requer imaginação, porque os dados que as pessoas encontram na vida nunca são completos e sempre são ambíguos.",
    source: "",
    en: {
      quote: "Perception requires imagination because the data people encounter in their lives are never complete and always equivocal.",
      quoteSource: "",
    },
  },
  {
    title: "A Revolução dos Bichos",
    quote: "Todos os animais são iguais, mas alguns animais são mais iguais do que outros.",
    source: "Capítulo X",
    en: {
      quote: "All animals are equal, but some animals are more equal than others.",
      quoteSource: "Chapter X",
    },
  },
];
