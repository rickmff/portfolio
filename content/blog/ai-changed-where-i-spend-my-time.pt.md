Banner: Johannes Vermeer, *O Geógrafo* (c. 1668–1669), Städel Museum. Um homem, seus instrumentos e a decisão que nenhum deles toma por ele. {{credit:banner}}

Hoje quase todo código que entra nos meus projetos passa por um modelo antes de passar por mim. E nunca trabalhei tanto com a cabeça. A IA não diminuiu o trabalho: ela tirou o gargalo do teclado e colocou na decisão. Digitar ficou barato. Decidir o que vale a pena escrever ficou caro.

## Rápido no novo, lento no antigo

Em 1975, Fred Brooks escreveu a lei mais citada da engenharia de software:

> "Adding manpower to a late software project makes it later."
> Fred Brooks, *The Mythical Man-Month* (1975)

A razão é que quem chega precisa aprender o contexto, e quem já está no projeto para de trabalhar para explicar. Um modelo de IA é o colega que chega todo dia sem lembrar de nada.

![Fred Brooks, autor de The Mythical Man-Month](img:brooks "Fred Brooks. {{credit:brooks}}")

No meu dia a dia é exatamente assim. Um script de migração ou um componente novo sai em minutos, porque não depende de história nenhuma. Uma mudança numa regra antiga do meu SaaS, que depende de decisões tomadas anos atrás, demora o mesmo tempo de sempre, só que agora eu gasto esse tempo explicando o contexto e lendo o que o modelo escreveu.

## O gargalo saiu do teclado

Brian Kernighan avisou, ainda nos anos 70, onde mora o trabalho difícil:

> "Everyone knows that debugging is twice as hard as writing a program in the first place."
> Brian Kernighan e P. J. Plauger, *The Elements of Programming Style* (1978)

Com IA, escrever quase não custa nada. O que sobra é ler, entender e consertar, que é justamente a parte difícil.

![Página do diário do Harvard Mark II de 1947 com uma mariposa colada, o primeiro "bug" registrado](img:bug "O primeiro bug documentado, em 1947: alguém precisou encontrar. {{credit:bug}}")

Minha rotina mudou de acordo. Antes eu abria o editor e começava a digitar. Hoje eu abro um diff de 300 linhas e preciso decidir, linha por linha, se aquilo é o que eu queria. Revisar bem exige saber como o código deveria ser antes de ver como ele está.

## Especificar virou a habilidade principal

Brooks de novo, em 1986, muito antes de qualquer modelo de linguagem:

> "The hardest single part of building a software system is deciding precisely what to build."
> Fred Brooks, *No Silver Bullet* (1986)

O modelo faz exatamente o que você pediu, inclusive quando você pediu errado. Um pedido vago volta como código plausível e genérico. Um pedido com contexto, restrições e um exemplo do resultado volta muito perto do que eu escreveria.

![O IBM System/360, projeto que Fred Brooks gerenciou na IBM](img:system360 "IBM System/360, o projeto que inspirou os ensaios de Brooks. {{credit:system360}}")

Um exemplo concreto: quando peço "cria um endpoint de exportação", recebo algo genérico. Quando escrevo "exporta as faturas do mês em CSV, só para o dono da conta, em streaming para não estourar memória, e com o mesmo formato de data do relatório atual", recebo algo que entra no projeto com poucos ajustes. A diferença está no texto, não no modelo.

## Onde eu não deixo a IA decidir

Em 1960, J. C. R. Licklider imaginou a parceria entre pessoas e computadores e deixou claro quem fazia o quê:

> "Men will set the goals and supply the motivations"
> J. C. R. Licklider, *Man-Computer Symbiosis* (1960)

O modelo escreve com a mesma confiança quando acerta e quando erra, e é fácil confundir confiança com correção. Por isso a parte de definir o objetivo e julgar o resultado continua comigo.

![Diagrama: a pessoa define objetivos, critérios e avaliação; o modelo rascunha, pesquisa e testa alternativas](img:goals "A divisão de Licklider aplicada ao meu dia a dia. Ilustração do autor")

Na prática tenho três regras. Esquema de banco e fronteiras entre serviços eu desenho primeiro, porque errar ali custa meses. Autenticação, permissões e qualquer coisa que toca dinheiro eu leio linha por linha. E código que eu não consigo explicar não entra, por mais que os testes passem.

## Quando isso não vale

Em código pequeno e descartável, revisar com esse cuidado é exagero: aceita, roda, joga fora. E para quem está começando, delegar cedo demais pula a parte que ensina. A IA acelera quem já sabe aonde quer chegar; quem ainda não sabe, ela leva com muita confiança na direção errada.

No fim, a régua subiu. Escrever código deixou de ser o diferencial. Saber o que pedir, perceber o que está errado e dizer não continua sendo trabalho de gente.
