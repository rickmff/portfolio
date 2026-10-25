Banner: Quentin Matsys, *O Cambista e sua Mulher* (1514), Museu do Louvre. Contar o dinheiro sempre foi um hábito, não um evento. {{credit:banner}}

Tenho um VPS rodando meus projetos e um SaaS que depende dele. Nenhum dos dois funciona no improviso: tem monitoramento, backup e um limite claro do que pode dar errado. Um dia percebi que eu não tinha nada disso com o meu próprio dinheiro. Então fiz o óbvio para um dev: tratei minhas finanças como infraestrutura.

## Custo fixo é infraestrutura

Benjamin Franklin resumiu, em 1758, o problema que todo dono de servidor conhece:

> "Beware of little expences; a small leak will sink a great ship."
> Benjamin Franklin, *The Way to Wealth* (1758)

![Retrato de Benjamin Franklin](img:franklin "Benjamin Franklin. {{credit:franklin}}")

Aluguel, contas, assinaturas e ferramentas são o que precisa estar de pé todo mês, como os serviços do servidor. E é aí que moram os vazamentos pequenos: o plano anual que renovou sozinho, a ferramenta que testei uma vez, o domínio que não uso mais. Uma vez por trimestre eu faço com as assinaturas o que faço com containers parados: listo tudo e desligo o que não uso.

## Reserva de emergência é redundância

Charles Dickens colocou na boca do Sr. Micawber a regra de orçamento mais famosa da literatura:

> "Annual income twenty pounds, annual expenditure nineteen nineteen and six, result happiness."
> Charles Dickens, *David Copperfield* (1850)

A frase seguinte do personagem é a mesma conta com seis pence a mais de gasto, e o resultado vira "misery". A diferença entre as duas é minúscula. É por isso que a margem importa.

![Ilustração do Sr. Micawber, personagem de David Copperfield](img:micawber "Sr. Micawber, de David Copperfield. {{credit:micawber}}")

Ninguém sobe produção sem backup, e a reserva é o backup da vida. Para quem é autônomo ou vive de projetos, ela permite recusar um trabalho ruim ou atravessar um mês fraco sem pânico. Eu defino a minha em meses de custo fixo, não num valor redondo, porque é esse custo que precisa continuar rodando.

## Automatize o caminho feliz

Benjamin Graham, o professor de Warren Buffett, escreveu no livro mais famoso sobre investimento:

> "The investor's chief problem — and even his worst enemy — is likely to be himself."
> Benjamin Graham, *The Intelligent Investor*

O maior risco do meu dinheiro não é o mercado, sou eu num dia cansado, decidindo na hora se guardo ou gasto. A saída é tirar essa decisão do dia a dia.

![Retrato de Benjamin Graham](img:graham "Benjamin Graham. {{credit:graham}}")

Na minha rotina isso virou duas regras. No dia em que a renda entra, uma parte vai sozinha para a reserva e para investimentos, antes que eu veja o saldo. E quando a renda sobe, o percentual automático sobe junto, antes que o padrão de gasto suba primeiro. Disciplina manual falha; agendamento não esquece.

## Monitore poucos números

Não acompanho cada café. Acompanho poucos números, como num dashboard enxuto de servidor: quanto entrou, quanto saiu, quanto foi guardado e quantos meses a reserva aguenta. Se algum sai da faixa normal, eu investigo. O resto é ruído.

![Gráfico de barras com uma linha de alerta tracejada](img:monitor "Uma linha de alerta vale mais que cem métricas. Ilustração do autor")

## Quando a analogia falha

Dinheiro não é só engenharia. Tem objetivo pessoal, família e imprevisto que nenhuma planilha cobre, e cortar tudo que "não é essencial" pode deixar a vida sem graça. E não sou consultor: isto é como organizo o meu, não recomendação de investimento.

Mas a lição que trouxe do servidor vale: sistema que ninguém observa quebra em silêncio. Comece listando seus custos fixos esta semana; é o `docker ps` das suas finanças.
