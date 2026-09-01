export type Milestone = {
  id: string
  project_id: string
  details: string | null
  owner: string | null
  projected_date: string | null
  actualized_date: string | null
  notes: string | null
  status: string
  created_at: string
}

export type MilestoneTask = {
  id?: string
  task: string
  sort_order?: number
}

export type ProjectNote = {
  id: string
  text: string
  created_at: string
  author_name: string | null
  author_email: string | null
}

export type MilestoneRow = {
  id?: string
  details: string
  owner: string
  owner_email: string
  projected_date: string
  actualized_date: string
  notes: string
  status: string
  tasks: MilestoneTask[]
}

export type MilestonesSavePayload = {
  milestones: MilestoneRow[]
  deleted_ids: string[]
}

export type MilestoneOption = {
  id: string
  details: string | null
}

export type TeamMember = {
  id: string
  project_id: string
  name: string | null
  task_milestone_id: string | null
  date_from: string | null
  date_to: string | null
  created_at: string
}

export type TeamMemberRow = {
  id?: string
  name: string
  email: string
}

export type CrewMemberRow = {
  id?: string
  name: string
  email: string
  task: string
  date_from: string
  date_to: string
}

export type TeamSavePayload = {
  team_members: TeamMemberRow[]
  deleted_ids: string[]
}

export type ProjectFile = {
  id: string
  project_id: string
  file_name: string
  file_type: string | null
  storage_path: string
  created_at: string
  url: string | null
}

export type MilestoneTemplateItem = {
  id: string
  template_id: string
  details: string | null
  notes: string | null
  sort_order: number
  tasks: MilestoneTask[]
}

export type MilestoneTemplate = {
  id: string
  name: string
  items: MilestoneTemplateItem[]
}

export type FinanceFile = {
  id: string
  project_id: string
  file_name: string
  file_type: string | null
  storage_path: string
  notes: string | null
  created_at: string
  url: string | null
}
