export interface StudentShortcut {
  icon: string;
  title: string;
  description: string;
  color: "red" | "blue" | "gray";
  href: string;
}

export interface StudentProfileSummary {
  name: string;
  initial: string;
  role: string;
}

export interface StudentNotice {
  title: string;
  description: string;
}

export interface StudentHomeData {
  profile: StudentProfileSummary;
  shortcuts: StudentShortcut[];
  notice: StudentNotice;
}
