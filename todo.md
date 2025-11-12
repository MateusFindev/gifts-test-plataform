# Project TODO

## Backend
- [x] Estruturar schema do banco de dados (testes, respostas, resultados)
- [x] Implementar API tRPC para criar novo teste
- [x] Implementar API tRPC para consultar resultado por email
- [x] Implementar API tRPC para salvar respostas de autoavaliação
- [x] Implementar API tRPC para gerar links de avaliação externa
- [x] Implementar API tRPC para salvar respostas de avaliação externa
- [x] Implementar lógica de cálculo de Dons Manifestos
- [x] Implementar lógica de cálculo de Dons Latentes
- [x] Configurar Nodemailer com SMTP do Gmail
- [x] Implementar envio de email com resultados

## Frontend
- [x] Criar página inicial com opções "Novo Teste" e "Consultar Resultado"
- [x] Criar página de informações do teste (nome, email, organização)
- [x] Criar componente de perguntas com 6 seções (180 perguntas)
- [x] Implementar navegação entre seções de perguntas
- [x] Criar página de geração de links para avaliação externa
- [x] Criar página de avaliação externa (30 perguntas)
- [x] Criar página de exibição de resultados (Dons Manifestos e Latentes)
- [x] Implementar consulta de resultado por email

## Dados
- [x] Criar arquivo JSON com os 30 dons
- [x] Criar arquivo JSON com as 180 perguntas de autoavaliação
- [x] Criar arquivo JSON com as 30 perguntas de avaliação externa
- [x] Criar mapeamento de perguntas para dons

## Testes e Deploy
- [ ] Testar fluxo completo de novo teste
- [ ] Testar fluxo de avaliação externa
- [ ] Testar cálculo de resultados
- [ ] Testar envio de email
- [ ] Testar consulta de resultado
- [ ] Criar checkpoint final

## Bugs
- [x] Corrigir erro "Cannot update a component while rendering" no CheckResult.tsx

## Melhorias Solicitadas
- [x] Adicionar referência a Christian A. Schwarz na página inicial
- [x] Investigar e corrigir problema de envio de email
- [x] Redesenhar interface de perguntas com substituição dinâmica da resposta na frase
- [x] Remover números das questões

## Ajustes de UX
- [x] Aumentar delay de auto-avanço de 300ms para 1500ms (1,5 segundos)
- [x] Adicionar feedback visual de transição entre perguntas

## Melhorias de Clareza Visual
- [x] Adicionar "..." em azul para indicar onde a opção será inserida
- [x] Reestruturar texto de cada seção com formato específico (Seção 1: "Sinto-me ... realizado(a) ao", etc.)

## Animação e Destaque Visual
- [x] Adicionar animação de "drop" quando a resposta é selecionada
- [x] Adicionar fundo colorido (highlight) na palavra inserida para destacar que faz parte da frase
- [x] Implementar transição suave (fade + scale) no encaixe da resposta

## Persistência de Dados
- [x] Implementar salvamento automático de respostas no localStorage
- [x] Restaurar progresso ao recarregar a página (TestQuestions)
- [x] Restaurar progresso ao recarregar a página (ExternalAssessment)
- [x] Salvar informações do teste (nome, email, organização, testId)

## Página de Explicação dos Dons
- [x] Criar arquivo com explicações dos 30 dons
- [x] Criar página GiftsExplanation.tsx
- [x] Adicionar rota para a página de explicação
- [x] Adicionar link "Conheça os Dons" na página inicial

## Melhorias Visuais e Branding
- [x] Tornar o botão "Conheça os 30 Dons Espirituais" mais visível e destacado
- [x] Separar explicações dos dons por cores (conforme código de cores do teste)
- [x] Adicionar explicação de cada código de cor na página
- [x] Adicionar logo da Control Fin Solutions
- [x] Adicionar créditos "Desenvolvido por Control Fin Solutions" no rodapé

## Correções de Cores e Logo
- [x] Corrigir mapeamento de cores dos dons (Verde: 10 dons, Vermelho: 10 dons, Azul: 10 dons)
- [x] Atualizar explicação das categorias de cores conforme especificação correta
- [x] Aumentar tamanho da logo da Control Fin Solutions no rodapé (de h-8 para h-16)

## Correções Críticas
- [x] 1. Impedir respostas duplicadas nos links de avaliação externa (cada link só pode ser respondido uma vez)
- [x] 2. Suportar múltiplos testes por email (histórico de resultados)
- [x] 3. Corrigir envio de email de resultados (logs detalhados adicionados para debug)
- [x] 4. Reorganizar explicação dos dons agrupados por categoria (Verde, Vermelho, Azul)
- [x] 5. Configurar Docker e preparar projeto para download

## Bug Crítico
- [x] Nenhum dom manifesto está sendo identificado nos resultados (corrigido: critério mudado de > 20 para >= 20)

## Ajuste de Critério
- [x] Alterar critério de Dons Manifestos de >= 20 para >= 15 pontos
