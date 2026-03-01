export interface Contact {
  role: string;
  name: string;
  phone: string;
}

export interface Project {
  id: string;
  title: string;
  company: string;
  address: string;
  directions: string;
  practical_info: string;
  contacts: Contact[];
  created_at: string;
}

export interface Post {
  id: string;
  project_id: string;
  image_url: string;
  text: string | null;
  role: string;
  is_done: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  project_id: string;
  text: string;
  created_at: string;
}

const projects: Project[] = [];
const posts: Post[] = [];
const questions: Question[] = [];

export function getProjects(): Project[] {
  return [...projects].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function addProject(data: Omit<Project, "id" | "created_at">): Project {
  const project: Project = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  projects.push(project);
  return project;
}

export function updateProject(id: string, data: Partial<Omit<Project, "id" | "created_at">>): void {
  const idx = projects.findIndex((p) => p.id === id);
  if (idx !== -1) {
    projects[idx] = { ...projects[idx], ...data };
  }
}

export function getPostsByProject(projectId: string): Post[] {
  return posts
    .filter((p) => p.project_id === projectId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function addPost(data: Omit<Post, "id" | "created_at">): Post {
  const post: Post = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  posts.push(post);
  return post;
}

export function getQuestionsByProject(projectId: string): Question[] {
  return questions
    .filter((q) => q.project_id === projectId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function addQuestion(data: Omit<Question, "id" | "created_at">): Question {
  const question: Question = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  questions.push(question);
  return question;
}
