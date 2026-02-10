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
}

export function exportToSmartsheetCSV(actionItems: ActionItem[]): string {
  const headers = [
    'Task Name',
    'Description',
    'Assigned To',
    'Status',
    'Priority',
    'Start Date',
    'End Date',
    'Duration',
    'Predecessors',
    '% Complete',
    'Comments',
    'Category',
    'Story Points',
    'Project'
  ];

  const rows = actionItems.map(item => {
    const startDate = new Date();
    const endDate = new Date(item.due_date);
    const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    const percentComplete = item.status === 'completed' ? 100 :
                           item.status === 'in_progress' ? 50 :
                           item.status === 'blocked' ? 0 : 0;

    return [
      escapeCsvField(item.title),
      escapeCsvField(item.description),
      escapeCsvField(item.assigned_to),
      mapStatusToSmartsheet(item.status),
      mapPriorityToSmartsheet(item.priority),
      formatDateForSmartsheet(startDate),
      formatDateForSmartsheet(endDate),
      `${durationDays}d`,
      '',
      percentComplete.toString(),
      escapeCsvField(item.acceptance_criteria || ''),
      item.category || '',
      item.story_points?.toString() || '',
      escapeCsvField(item.company_name || 'EDI Project')
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

function mapStatusToSmartsheet(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Not Started',
    'in_progress': 'In Progress',
    'completed': 'Complete',
    'blocked': 'Blocked'
  };
  return statusMap[status.toLowerCase()] || 'Not Started';
}

function mapPriorityToSmartsheet(priority: string): string {
  const priorityMap: Record<string, string> = {
    'critical': 'High',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low'
  };
  return priorityMap[priority.toLowerCase()] || 'Medium';
}

function formatDateForSmartsheet(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function escapeCsvField(field: string | undefined): string {
  if (!field) return '';

  const fieldStr = String(field);
  if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
    return `"${fieldStr.replace(/"/g, '""')}"`;
  }
  return fieldStr;
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv') {
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

export function exportActionItemsToSmartsheet(
  actionItems: ActionItem[],
  companyName: string
) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${companyName.replace(/\s+/g, '_')}_smartsheet_prioritization_${timestamp}.csv`;

  const csvContent = exportToSmartsheetCSV(actionItems);
  downloadFile(csvContent, filename, 'text/csv');
}
