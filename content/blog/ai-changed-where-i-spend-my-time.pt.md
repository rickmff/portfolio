Hoje quase toda linha de código que entra nos meus projetos passa por um modelo antes de passar por mim. Dá para achar que isso significa trabalhar menos. É o contrário: nunca trabalhei tanto com a cabeça. Digitar ficou barato. Decidir o que vale a pena digitar ficou caro.

## Rápido no novo, lento no antigo

Imagina contratar alguém ótimo no que faz, mas que esquece tudo de um dia para o outro. Toda manhã você explica o projeto do zero, onde fica cada coisa e por que existe aquela regra estranha. Trabalhar com um modelo de IA é isso. O Fred Brooks percebeu algo parecido décadas atrás, quando disse que colocar mais gente num projeto de software atrasado só atrasa mais: quem chega precisa aprender o contexto, e quem já está lá para tudo para explicar.

No meu dia a dia é exatamente assim. Um script de migração ou um componente novo sai em minutos, porque não depende de história nenhuma. Mudar uma regra antiga do meu SaaS, que depende de decisões tomadas anos atrás, leva o mesmo tempo de sempre. A diferença é que agora eu gasto esse tempo explicando contexto e lendo o que o modelo escreveu.

## O gargalo saiu do teclado

Pensa em cozinhar com um amigo que pica tudo em dois minutos. O jantar não fica pronto mais rápido se você ainda precisa conferir cada pedaço para ver se ele cortou do jeito que a receita pedia. Picar ficou barato; conferir, não.

Com código é igual. O Brian Kernighan dizia que todo mundo sabe que depurar é duas vezes mais difícil do que escrever o programa. Com IA, escrever quase não custa nada. O que sobra é ler, entender e consertar, que sempre foi a parte difícil.

![Página do diário do Harvard Mark II de 1947 com uma mariposa colada, o primeiro "bug" registrado](img:bug "O primeiro bug documentado, em 1947: alguém precisou encontrar")

Então minha rotina inverteu. Antes eu abria o editor e começava a digitar. Hoje eu abro um diff de 300 linhas e decido, linha por linha, se aquilo é o que eu queria. E só dá para revisar bem quando você sabe como o código deveria ser antes de ver como ele está.

## Pedir bem virou a habilidade principal

Já pediu para alguém "trazer alguma coisa para o jantar" e recebeu uma pizza congelada? Ninguém errou; você é que não foi claro. O modelo é assim: faz exatamente o que você pediu, mesmo quando você pediu mal. O Brooks também dizia que a parte mais difícil de construir software é decidir exatamente o que construir, e ele disse isso muito antes de alguém conversar com um modelo de linguagem.

Um exemplo real: quando peço "cria um endpoint de exportação", recebo algo genérico. Quando escrevo "exporta as faturas do mês em CSV, só para o dono da conta, em streaming para não estourar memória, e com o mesmo formato de data do relatório atual", recebo algo que entra no projeto com poucos ajustes. O modelo é o mesmo. O que mudou foi o texto.

## Onde eu não deixo a IA decidir

O modelo fala com a mesma confiança quando acerta e quando erra, igual aquele amigo que te passa o caminho com toda a certeza do mundo e te manda para o outro lado da cidade. É fácil confundir confiança com estar certo. O J. C. R. Licklider, que imaginou essa parceria entre pessoas e computadores quando computador ainda ocupava uma sala inteira, já tinha a divisão clara: as pessoas definem os objetivos e dão a motivação, a máquina faz o resto.

![Diagrama: a pessoa define objetivos, critérios e avaliação; o modelo rascunha, pesquisa e testa alternativas](img:goals "A divisão de Licklider aplicada ao meu dia a dia")

Na prática tenho três regras. Esquema de banco e fronteiras entre serviços eu desenho primeiro, e eu mesmo, porque errar ali custa meses. Autenticação, permissões e qualquer coisa que toca dinheiro eu leio linha por linha. E código que eu não consigo explicar não entra, por mais que os testes passem.

## Quando isso não vale

Em código pequeno e descartável, esse cuidado todo é exagero. Um script para renomear um monte de arquivos? Aceita, roda, joga fora. E para quem está começando, entregar tudo cedo demais pula justamente a parte que ensina. A IA acelera quem já sabe aonde quer chegar. Quem ainda não sabe, ela leva para o lado errado, com muita confiança.

No fim, a régua subiu. Escrever código deixou de ser o diferencial. Saber o que pedir, perceber o que está errado e dizer não continua sendo trabalho de gente.
