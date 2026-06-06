export enum OrderState {
  DRAFT = 'DRAFT', // Rascunho/Orçamento
  AWAITING_DEPOSIT = 'AWAITING_DEPOSIT', // Aguardando Sinal
  RESERVED = 'RESERVED', // Reservado
  IN_PROGRESS = 'IN_PROGRESS', // Em andamento (Retirado)
  PENDING_INSPECTION = 'PENDING_INSPECTION', // Devolvido Pendente de Inspeção
  COMPLETED = 'COMPLETED', // Concluído
  COMPLETED_WITH_DAMAGES = 'COMPLETED_WITH_DAMAGES' // Concluído com Avarias
}