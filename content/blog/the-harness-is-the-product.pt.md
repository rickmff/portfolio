Banner: J. M. W. Turner, *Chuva, Vapor e Velocidade* (1844), National Gallery. A locomotiva só vira viagem por causa dos trilhos. {{credit:banner}}

Todo mês sai um modelo novo que promete ser o melhor do mundo. E quase todo mês o que realmente muda o meu dia é outra coisa: o harness, a camada em volta do modelo que decide o que ele vê, o que ele pode fazer e quando ele para. O modelo é o motor. O harness é o carro.

## O modelo pensa, o harness age

Thomas Carlyle escreveu, em 1836, uma frase que serve para pessoas e, hoje, para agentes:

> "Nowhere do you find him without Tools; without Tools he is nothing, with Tools he is all."
> Thomas Carlyle, *Sartor Resartus* (1836)

Um modelo sozinho só recebe texto e devolve texto. Quem transforma isso em trabalho é o loop em volta: chamar o modelo, executar a ação que ele pediu, devolver o resultado e chamar de novo.

![Diagrama do loop de um agente: o modelo pensa, o harness executa a ferramenta, o resultado volta para o modelo](img:loop "O loop de um agente. Ilustração do autor")

É exatamente o que vejo no Claude Code: ele lê um arquivo, roda os testes, lê o erro, corrige e roda de novo. Claude Code, Cursor e Codex são harnesses. O mesmo modelo, em harnesses diferentes, parece outro produto.

## Automatizar o que não precisa de pensamento

O matemático Alfred North Whitehead escreveu, em 1911:

> "Civilization advances by extending the number of important operations which we can perform without thinking about them."
> Alfred North Whitehead, *An Introduction to Mathematics* (1911)

Um bom harness faz isso pelo agente. Ele não precisa redescobrir a cada sessão como o projeto funciona, porque isso já está escrito.

![Retrato de Joseph Marie Jacquard tecido em seda num tear de Jacquard](img:jacquard "Retrato de Jacquard tecido no próprio tear, comandado por milhares de cartões perfurados: o padrão ficava guardado, ninguém precisava lembrar dele. {{credit:jacquard}}")

No meu caso são três peças. Um arquivo de instruções na raiz do repositório, com convenções, comandos de build e o que nunca fazer, que é o onboarding que eu daria a um dev novo. Skills, que transformam procedimentos repetidos em instruções reutilizáveis: este post foi revisado e publicado por duas delas, que chamam a API de conteúdo do site. E hooks, que rodam lint e testes depois de cada edição, para o agente ver o erro antes de mim.

## Confie, mas verifique

Ronald Reagan popularizou um provérbio russo ao assinar um tratado de desarmamento com Gorbachev, em 1987:

> "Trust, but verify."
> Ronald Reagan (1987)

É a melhor descrição que conheço de como configurar um agente. A ferramenta que o modelo recebe importa tanto quanto o modelo: comandos claros, saídas curtas e limites explícitos fazem um modelo médio parecer bom, e ferramentas confusas fazem um modelo bom parecer perdido.

![Regulador centrífugo de Watt, que controlava a velocidade de motores a vapor](img:governor "O regulador de Watt não aumentava a força do motor, só a tornava segura de usar. {{credit:governor}}")

Na prática, a parte mais importante do meu harness são as permissões. O agente lê o que quiser no projeto, mas deploy, delete e qualquer coisa que toca produção no meu VPS passam por mim. É o mesmo princípio do regulador de Watt: não deixa o motor mais forte, deixa ele seguro.

## Quando isso não vale

Em 2019, Rich Sutton abriu um ensaio famoso assim:

> "The biggest lesson that can be read from 70 years of AI research"
> Rich Sutton, *The Bitter Lesson* (2019)

A lição, segundo ele, é que os métodos gerais que aproveitam mais computação acabam vencendo as soluções cheias de conhecimento humano embutido. O exemplo clássico é o xadrez, em que a busca em força bruta superou anos de heurísticas escritas à mão.

![O computador Deep Blue, da IBM, que venceu Kasparov em 1997](img:deepblue "Deep Blue: a força bruta venceu as heurísticas escritas à mão. {{credit:deepblue}}")

A lição para harnesses é manter a camada fina. Regra que só existe para contornar uma fraqueza do modelo de hoje vira peso morto quando o próximo modelo sai. Para uma pergunta solta ou um script de dez linhas, o chat puro resolve. O harness paga quando o trabalho se repete: o mesmo repositório, os mesmos fluxos, semana após semana.

Meu conselho é simples: antes de trocar de modelo, escreva o arquivo de instruções do seu projeto. Na minha página de [Harness](/harness) estão as ferramentas que uso todo dia.
