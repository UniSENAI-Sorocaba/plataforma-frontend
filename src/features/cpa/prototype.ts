export const CPA_QUESTIONS = ["Os espaços de estudo atendem às atividades do curso.", "Os recursos digitais apoiam meu aprendizado.", "Encontro os canais de apoio quando preciso."] as const;
export const SCALE = ["Discordo totalmente", "Discordo", "Nem concordo nem discordo", "Concordo", "Concordo totalmente"] as const;
/** Prototype deliberately accepts no free text or identity; there is no submission endpoint. */
export function validAnswers(answers: readonly number[]): boolean {
  return answers.length === CPA_QUESTIONS.length && answers.every(n => Number.isInteger(n) && n >= 1 && n <= 5);
}
