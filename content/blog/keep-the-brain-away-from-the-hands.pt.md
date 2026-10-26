Eu estava lendo o post de engenharia da Anthropic sobre os Managed Agents, aquele com o subtítulo "desacoplando o cérebro das mãos", e no meio do texto parei para reler um parágrafo. Ele conta de uma correção que o time fez para um modelo antigo, e de como essa correção virou peso morto quando chegou um modelo mais novo. É o tipo de coisa que eu normalmente só percebo no meu próprio código meses depois. Então aqui vai o que ficou comigo, como alguém que constrói um SaaS e roda tudo na própria VPS.

## O harness envelhece

O harness é o loop em volta do modelo: chama o Claude, lê a resposta, executa as ferramentas que ele pediu e devolve os resultados. Todo harness carrega palpites sobre o que o modelo ainda não consegue fazer.

O post dá um exemplo claro. Com o Claude Sonnet 4.5, o time viu o que chamou de "ansiedade de contexto": o modelo encerrava as tarefas antes da hora quando sentia a janela de contexto enchendo. Então eles colocaram resets de contexto no harness. No Claude Opus 4.5 o comportamento sumiu, e os resets viraram só código que ninguém mais precisava.

A resposta do post não é um harness mais esperto. É um conjunto pequeno de interfaces que fica parado enquanto os harnesses por trás delas continuam mudando, que é bem o que o John Gall quis dizer quando falou que todo sistema complexo que funciona nasceu de um sistema simples que funcionava. Eles até comparam com um sistema operacional: "processo" e "arquivo" sobreviveram a todo hardware em que já rodaram.

## Cérebro, mãos e um log

O desenho divide um agente em três partes:

- **Sessão**: um log só de escrita no final (append-only) com tudo o que aconteceu.
- **Harness** (o cérebro): o loop que chama o modelo e encaminha as chamadas de ferramenta.
- **Sandbox** (as mãos): onde o código roda e os arquivos são editados.

![Diagrama: o harness lê e escreve no log da sessão e chama sandboxes e ferramentas por uma única interface execute](img:diagram "Cérebro, mãos e log, cada um trocável sozinho")

Nos Managed Agents, toda mão parece igual para o cérebro: `execute(name, input) → string`. Um container, um servidor MCP ou, no exemplo deles, um emulador de Pokémon, todos atrás da mesma assinatura. Pensa numa tomada: você liga o carregador do celular, a chaleira ou o abajur, e a parede não quer saber qual é. O Aristóteles chamava a mão de "o instrumento dos instrumentos", e é exatamente esse o papel dela aqui.

## Gado, não pet

A primeira versão colocava as três partes num container só. Quem cuida de servidor sabe como isso termina. O container vira um pet: se ele morre, a sessão vai junto, e alguém precisa cuidar dele até voltar sem poder olhar dentro, porque ele guarda dados de usuário.

Depois da separação, o container é gado. Se ele morre, o erro volta para o Claude como uma chamada de ferramenta que falhou, e um novo é criado. O harness também é gado: como o log fica fora dele, um harness novo chama `wake(sessionId)`, lê os eventos e continua do último.

É a mesma regra que eu daria para qualquer um que roda o próprio servidor: o estado fica no banco e nos backups, nunca na máquina. Ver isso aplicado a agentes fez o desenho fazer sentido na hora.

## As chaves ficam fora da sandbox

No desenho acoplado, o código que o Claude escrevia rodava do lado das credenciais. Bastava um prompt injection que convencesse o modelo a ler o próprio ambiente.

É como dar para a diarista uma senha da fechadura em vez de uma cópia da sua chave. A correção é estrutural. O token do git clona o repositório quando a sandbox começa e fica dentro do remote, então push e pull funcionam sem o agente nunca ver o token. Os tokens de MCP ficam num cofre e passam por um proxy. Nas palavras do post, "o harness nunca fica sabendo de nenhuma credencial."

O Benjamin Franklin brincava que três pessoas conseguem guardar um segredo se duas delas estiverem mortas. Aqui ninguém precisa morrer: o agente não vaza um token que nunca viu. Gosto disso porque não depende do modelo se comportar bem. Tira dele a chance de se comportar mal.

## O log não é a janela de contexto

A parte que achei mais interessante é a diferença entre a sessão e a janela de contexto. Compactar e cortar contexto são decisões sem volta: você joga algo fora hoje sem saber se vai precisar amanhã. Nos Managed Agents, o log guarda tudo, e o harness escolhe o que entra na janela, com o `getEvents()` podendo ler pedaços, voltar e reler o que levou a um momento.

Guardar é um trabalho e gerenciar contexto é outro. O primeiro precisa ser durável. O segundo pode mudar a cada modelo novo.

## E ficou mais rápido

Tirar o harness do container também deixou tudo mais rápido. Antes, toda sessão esperava um container subir, mesmo que nunca fosse usar. Agora o container só sobe quando uma ferramenta pede. O time conta que o tempo até o primeiro token caiu cerca de 60% na mediana e mais de 90% no p95.

## O que eu levo disso

Se eu fosse resumir numa linha: seja rígido no formato das interfaces e tranquilo com o que roda atrás delas. Vale para agentes e vale para o resto da stack. O modelo vai mudar, o harness vai mudar, a sandbox vai mudar. O log e o contrato entre eles são o que deve ficar.
