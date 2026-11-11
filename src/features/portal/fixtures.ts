import { COURSES, type PublicProject } from "./catalog";
const names = ["Tecnologia que aproxima", "Energia para o amanhã", "Água em ciclo", "Aprender sem barreiras", "Oficina circular", "Comunidade conectada", "Mobilidade para todos", "Horta inteligente", "Produção responsável", "Acesso digital", "Materiais em transformação", "Cidade colaborativa"];
/** Synthetic projects only. Never use student records as development fixtures. */
export const DEMO_PROJECTS: (PublicProject & { published: boolean })[] = names.map((title, i) => ({
  id: `demo-${String(i + 1).padStart(2, "0")}`, title,
  summary: "Projeto fictício de demonstração que conecta conhecimento acadêmico a soluções para a comunidade.",
  course: COURSES[i % COURSES.length], semester: i % 2 ? "2026.1" : "2026.2",
  ods: [4, [9, 7, 6, 10, 12, 11][i % 6]], published: true,
}));
DEMO_PROJECTS.push({ id: "private-draft", title: "RASCUNHO PRIVADO NÃO PUBLICAR", summary: "Conteúdo privado sintético", course: COURSES[0], semester: "2026.2", ods: [4], published: false });
