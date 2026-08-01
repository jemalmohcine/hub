export type CvThemeId = "minimal" | "modern" | "classic" | "tech";

export type CvSkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type CvSkill = {
  id: string;
  name: string;
  level?: CvSkillLevel;
};

export type CvSkillGroup = {
  id: string;
  label: string;
  skills: CvSkill[];
};

export type CvExperience = {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: string[];
  techStack: string[];
};

export type CvProject = {
  id: string;
  name: string;
  url?: string;
  description: string;
  highlights: string[];
  techStack: string[];
};

export type CvEducation = {
  id: string;
  school: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate: string;
  highlights: string[];
};

export type CvCertification = {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
};

export type CvLanguage = {
  id: string;
  name: string;
  level: string;
};

export type CvOpenSource = {
  id: string;
  name: string;
  url?: string;
  description: string;
  stars?: string;
};

export type CvProfile = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
  summary: string;
};

export type CvDocument = {
  id?: string;
  title: string;
  themeId: CvThemeId;
  profile: CvProfile;
  skillGroups: CvSkillGroup[];
  experiences: CvExperience[];
  projects: CvProject[];
  education: CvEducation[];
  certifications: CvCertification[];
  languages: CvLanguage[];
  openSource: CvOpenSource[];
};
