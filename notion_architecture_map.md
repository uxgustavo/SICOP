# Arquitetura de Frontend e Regras de Negócio: Gestão de Contratos Públicos

**Instrução para o Agente (Antigravity):** Atue como um Arquiteto de Frontend Sênior (React, TypeScript, Tailwind). Nossa missão agora é construir a interface de usuário e a camada de estado (State Management) de um sistema de Gestão de Contratos Públicos. 

O backend definitivo (com integração ao SIGEF) será construído no futuro. Portanto, você deve criar as Interfaces (TypeScript), os serviços de "Mock" temporários e os componentes visuais de forma que as regras de negócio já operem 100% no Frontend, simulando o comportamento real.

Leia atentamente as regras de domínio abaixo para construir os componentes:

---

## 1. Tipagem (TypeScript Interfaces) e Estrutura de Dados

O estado da aplicação deve refletir a separação entre dados locais (editáveis) e dados externos do SIGEF (somente leitura). Crie as seguintes interfaces em um arquivo `src/types/contract.d.ts`:

* **`Contract`**: Deve conter `id`, `numeroContrato`, `cnpjContratada`, `nomeContratada`, `dataInicio`, `dataFimOriginal`, `valorAnualOriginal`, `status`.
* **`Aditivo`**: Deve conter `id`, `contratoId`, `tipo` (PRAZO, VALOR, AMBOS), `acrescimoValor`, `novaDataFim`.
* **`TransacaoFinanceira` (Mock do SIGEF)**: Deve conter `id`, `contratoId`, `tipo` (EMPENHO, PAGAMENTO, CANCELAMENTO), `valor`, `dataTransacao`, `dotacaoCodigo`.

---

## 2. Regras de Negócio aplicadas ao Frontend (Lógica e Hooks)

Você deve criar Hooks customizados (ex: `useContractCalculations`) ou funções utilitárias que processem as seguintes lógicas vitais em tempo de execução:

### 2.1. Imutabilidade e Aditivos (O Cálculo do Valor Atualizado)
* **Regra:** A interface NUNCA deve permitir que o usuário edite diretamente o `valorAnualOriginal` ou a `dataFimOriginal` de um contrato já salvo.
* **Lógica do Hook:** Crie funções que leiam o Contrato e o array de seus Aditivos para retornar propriedades computadas:
    * `valorAtualizado = valorAnualOriginal + sum(Aditivos.acrescimoValor)`
    * `dataFimVigente =` a `novaDataFim` do aditivo de prazo mais recente (ou a original, se não houver).

### 2.2. O Sistema de Alertas (Trigger de 120 dias)
* **Lógica:** O frontend deve calcular dinamicamente os dias restantes comparando `new Date()` com a `dataFimVigente`.
* **UI/UX:** Se faltarem 120 dias ou menos, o card do contrato no Dashboard e o cabeçalho da página de detalhes devem exibir um alerta visual claro (ex: Badge laranja/vermelho, ícone de atenção) indicando a necessidade de renovação/nova licitação.

### 2.3. O Motor Financeiro Visual (Read-Only)
* **Lógica:** Crie funções que filtrem o array de `TransacaoFinanceira` para calcular dinamicamente:
    * `Total Empenhado` = Soma dos Empenhos - Soma dos Cancelamentos.
    * `Total Pago` = Soma dos Pagamentos.
    * `Saldo de Empenho` = Total Empenhado - Total Pago.
* **UI/UX:** A aba "Financeiro" na tela de detalhes do contrato DEVE ser estritamente "Somente Leitura". Não renderize botões de "Adicionar", "Editar" ou "Excluir" nessas tabelas. Adicione um componente visual de "Aviso" no topo desta aba dizendo: *"Dados financeiros integrados via SIGEF. Somente leitura."* acompanhado de um timestamp mockado de "Última sincronização".

---

## 3. Plano de Ação (Tarefas Imediatas)

Com base neste documento, execute os seguintes passos no código do projeto:

1.  **Tipagem:** Crie o arquivo `types/contract.d.ts` com as interfaces.
2.  **Mock Service:** Crie um arquivo `services/mockData.ts` contendo um array de contratos, alguns aditivos e transações financeiras simulando o SIGEF, para podermos testar a UI.
3.  **Lógica:** Crie o hook `hooks/useContract.ts` que implemente os cálculos matemáticos e de datas descritos na seção 2.
4.  **UI Base:** Crie a estrutura inicial da tela de "Detalhes do Contrato" (`pages/ContractDetails.tsx`), dividindo a interface em abas visuais (Visão Geral, Aditivos, Financeiro SIGEF).

Trabalhe de forma sequencial, focando primeiro nas tipagens e lógicas. Me avise quando concluir o passo 2 para revisarmos antes de focar pesado no Tailwind.