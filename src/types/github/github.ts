// 任务项接口定义
interface WorkItem {
  id: string;
  time: string;
  title: string;
  description: string;
  source: string;
  sourceType: "github" | "pingcode" | "system";
  completed: boolean;
}

interface GithubIssueType {
  id: number;
  node_id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
  is_enabled: boolean;
}
// GitHub Issue 接口定义
interface GithubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  assignee: { login: string; avatar_url: string } | null;
  user: { login: string; avatar_url: string };
  repository: { id: number; name: string; full_name: string };
  html_url: string;
  created_at: string;
  updated_at: string;
  type?: GithubIssueType;
}

interface GithubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: { login: string; avatar_url: string };
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  is_subscribed: boolean;
  watchers_count: number;
  stargazers_count: number;
  open_issues_count: number;
}
