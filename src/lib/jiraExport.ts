interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  assigned_to: string;
  status: string;
  due_date: string;
  category?: string;
  story_points?: number;
  labels?: string[];
  acceptance_criteria?: string;
  company_name?: string;
  epic_link?: string;
}

interface JiraIssue {
  summary: string;
  description: string;
  issueType: string;
  priority: string;
  assignee: string;
  dueDate: string;
  storyPoints?: number;
  labels: string[];
  acceptanceCriteria?: string;
  epicLink?: string;
  customFields?: Record<string, any>;
}

export function exportToJiraJSON(actionItems: ActionItem[], projectKey: string = 'EDI'): string {
  const jiraIssues = actionItems.map((item, index) => {
    const jiraIssue: JiraIssue = {
      summary: item.title,
      description: formatDescription(item),
      issueType: determineIssueType(item),
      priority: mapPriorityToJira(item.priority),
      assignee: item.assigned_to,
      dueDate: item.due_date,
      storyPoints: item.story_points,
      labels: item.labels || [],
      acceptanceCriteria: item.acceptance_criteria,
      epicLink: item.epic_link,
      customFields: {
        category: item.category,
        originalId: item.id,
      }
    };

    return jiraIssue;
  });

  return JSON.stringify({ issues: jiraIssues }, null, 2);
}

export function exportToJiraCSV(actionItems: ActionItem[]): string {
  const headers = [
    'Summary',
    'Description',
    'Issue Type',
    'Priority',
    'Assignee',
    'Due Date',
    'Story Points',
    'Labels',
    'Acceptance Criteria',
    'Epic Link',
    'Category',
    'Status'
  ];

  const rows = actionItems.map(item => [
    escapeCsvField(item.title),
    escapeCsvField(item.description),
    determineIssueType(item),
    mapPriorityToJira(item.priority),
    escapeCsvField(item.assigned_to),
    item.due_date,
    item.story_points?.toString() || '',
    escapeCsvField((item.labels || []).join(', ')),
    escapeCsvField(item.acceptance_criteria || ''),
    item.epic_link || '',
    item.category || '',
    item.status
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

export function exportToJiraImportFormat(actionItems: ActionItem[], epicName?: string): string {
  const lines: string[] = [];

  lines.push('Issue Type,Summary,Description,Priority,Assignee,Due Date,Story Points,Labels,Epic Link');

  actionItems.forEach(item => {
    const line = [
      determineIssueType(item),
      escapeCsvField(item.title),
      escapeCsvField(formatDescription(item)),
      mapPriorityToJira(item.priority),
      escapeCsvField(item.assigned_to),
      item.due_date,
      item.story_points?.toString() || '3',
      escapeCsvField((item.labels || []).join(' ')),
      epicName || item.epic_link || ''
    ].join(',');

    lines.push(line);
  });

  return lines.join('\n');
}

function formatDescription(item: ActionItem): string {
  let description = item.description;

  if (item.acceptance_criteria) {
    description += `\n\n*Acceptance Criteria:*\n${item.acceptance_criteria}`;
  }

  if (item.category) {
    description += `\n\n*Category:* ${item.category}`;
  }

  return description;
}

function determineIssueType(item: ActionItem): string {
  if (item.category === 'custom_development') {
    return 'Story';
  }
  if (item.category === 'testing') {
    return 'Test';
  }
  if (item.priority === 'critical') {
    return 'Bug';
  }
  return 'Task';
}

function mapPriorityToJira(priority: string): string {
  const priorityMap: Record<string, string> = {
    'critical': 'Highest',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low'
  };
  return priorityMap[priority.toLowerCase()] || 'Medium';
}

function escapeCsvField(field: string | undefined): string {
  if (!field) return '';

  const fieldStr = String(field);
  if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
    return `"${fieldStr.replace(/"/g, '""')}"`;
  }
  return fieldStr;
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportActionItemsToJira(
  actionItems: ActionItem[],
  format: 'json' | 'csv' | 'jira',
  companyName: string
) {
  const timestamp = new Date().toISOString().split('T')[0];
  const baseFilename = `${companyName.replace(/\s+/g, '_')}_action_items_${timestamp}`;

  switch (format) {
    case 'json':
      const jsonContent = exportToJiraJSON(actionItems);
      downloadFile(jsonContent, `${baseFilename}.json`, 'application/json');
      break;

    case 'csv':
      const csvContent = exportToJiraCSV(actionItems);
      downloadFile(csvContent, `${baseFilename}.csv`, 'text/csv');
      break;

    case 'jira':
      const jiraContent = exportToJiraImportFormat(actionItems, companyName);
      downloadFile(jiraContent, `${baseFilename}_jira_import.csv`, 'text/csv');
      break;
  }
}
