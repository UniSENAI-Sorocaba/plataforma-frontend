import type { StudentHomeData } from "./types";

/**
 * Mock data representing the response of AUTH-08-BE student profile and portal endpoints.
 * When the backend is ready, replace or toggle this with a fetch to `/api/v1/student/home`.
 */
export const MOCK_STUDENT_HOME_DATA: StudentHomeData = {
  profile: {
    name: "Área do aluno",
    initial: "A",
    role: "Aluno Regular",
  },
  shortcuts: [
    {
      icon: "⌂",
      title: "Início",
      description: "Acompanhe sua jornada acadêmica.",
      color: "red",
      href: "#inicio",
    },
    {
      icon: "▤",
      title: "Meus projetos",
      description: "Consulte seus projetos integradores.",
      color: "blue",
      href: "#atalhos",
    },
    {
      icon: "◷",
      title: "Extensão",
      description: "Explore atividades extensionistas.",
      color: "gray",
      href: "#atalhos",
    },
  ],
  notice: {
    title: "Um espaço para construir o futuro.",
    description: "Novas informações e atividades aparecerão aqui conforme sua jornada avançar.",
  },
};

export async function getStudentHomeData(): Promise<StudentHomeData> {
  // Simulates future backend fetch:
  // if (process.env.API_URL) { return fetch(API_URL).then(res => res.json()); }
  return Promise.resolve(MOCK_STUDENT_HOME_DATA);
}
