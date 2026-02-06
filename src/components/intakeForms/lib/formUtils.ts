import { FormTemplate, FormData, FormField, ValidationError } from '../types';

export function extractValueFromResponse(response: string, field: FormField): string {
  let cleaned = response.trim();

  // Common conversational prefixes to remove
  const prefixes = [
    /^(my|the|it'?s?|i'?m|i am|that'?s?|this is)\s+/i,
    /^(name is|called|email is|phone is|phone number is|number is)\s+/i,
    /^(address is|located at|live at|living at)\s+/i,
    /^(born on|birthday is|date is|dob is)\s+/i,
    /^(prefer|preference is|want|would like)\s+/i,
  ];

  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, '');
  }

  // Remove "a " or "an " at the start
  cleaned = cleaned.replace(/^(a|an)\s+/i, '');

  // Handle field-specific extraction
  if (field.type === 'email') {
    // Convert voice-transcribed email to actual email format
    let emailText = cleaned.toLowerCase();

    // Handle single-letter spacing (e.g., "j o h n" -> "john")
    // Match patterns where single letters/characters are separated by spaces
    if (/^([a-z]\s+){2,}/.test(emailText) || /(\s+[a-z]){2,}\s+/.test(emailText)) {
      // Remove spaces between single characters
      emailText = emailText.replace(/\b([a-z])\s+(?=[a-z]\b)/g, '$1');
    }

    // Handle concatenated "at" patterns like "doeattest" or "hn@directest"
    emailText = emailText.replace(/([a-z]+)at([a-z]+\.(com|net|org|edu|co|io|dev))/gi, '$1@$2');

    // Handle patterns like "hn@directest.com" where local part is too short/weird
    // If we find an @ with suspicious local part, try to extract a better email
    const suspiciousPattern = /([a-z\s]{1,3})@([a-z]+)\.(com|net|org|edu|co|io|dev)/i;
    if (suspiciousPattern.test(emailText)) {
      // Look for longer word sequences that might be the real local part
      const words = emailText.split(/[@\s]+/);
      const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, '');
      if (longestWord.length > 3) {
        // Try to rebuild email with longest word as local part
        const domainMatch = emailText.match(/([a-z]+)\.(com|net|org|edu|co|io|dev)/i);
        if (domainMatch) {
          emailText = `${longestWord}@${domainMatch[0]}`;
        }
      }
    }

    // Handle standalone "a" before domain patterns
    emailText = emailText.replace(/\s+a([a-z]+\.(com|net|org|edu|co|io|dev))/gi, '@$1');

    // Replace voice patterns for @ symbol
    emailText = emailText.replace(/\s+at\s+/gi, '@');
    emailText = emailText.replace(/\s+a\s+/gi, '@');

    // Replace "dot" with "."
    emailText = emailText.replace(/\s+dot\s+/gi, '.');
    emailText = emailText.replace(/\sdot\s/gi, '.');

    // Handle "rate" or similar words that might mean domain extensions
    emailText = emailText.replace(/\s+rate\s*$/i, '.com');
    emailText = emailText.replace(/\s+rate([a-z]+)/i, '@$1.com');

    // Clean up spaces in email patterns
    if (emailText.includes('@') || /\w+\s+\w+\s*\.\s*com/i.test(emailText)) {
      emailText = emailText.replace(/\s+@/g, '@').replace(/@\s+/g, '@');
      emailText = emailText.replace(/\s*\.\s*/g, '.');

      const parts = emailText.split('@');
      if (parts.length === 2) {
        const localPart = parts[0].replace(/\s+/g, '');
        const domainPart = parts[1].replace(/\s+/g, '');
        emailText = `${localPart}@${domainPart}`;
      } else {
        emailText = emailText.replace(/\s+/g, '');
      }
    }

    // Extract email pattern
    const emailMatch = emailText.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
    if (emailMatch) {
      return emailMatch[0];
    }

    // If no valid email found yet, try to construct one from available parts
    // Look for domain patterns and construct email from remaining text
    const domainPattern = /([a-z]+)\.(com|net|org|edu|co|io|dev)/i;
    const domainMatch = emailText.match(domainPattern);
    if (domainMatch && !emailText.includes('@')) {
      // Find text before domain that could be local part
      const beforeDomain = emailText.substring(0, emailText.indexOf(domainMatch[0])).trim().replace(/\s+/g, '');
      if (beforeDomain.length > 0) {
        return `${beforeDomain}@${domainMatch[0]}`;
      }
    }
  }

  if (field.type === 'phone') {
    // Extract phone number pattern
    const phoneMatch = cleaned.match(/[\d\s\-()]+/);
    if (phoneMatch) {
      return phoneMatch[0].trim();
    }
  }

  if (field.type === 'number') {
    // Extract number from response
    const numberMatch = cleaned.match(/\d+/);
    if (numberMatch) {
      return numberMatch[0];
    }
  }

  if (field.type === 'date') {
    // Try to extract date patterns
    // Handle formats like "January 15, 1990" or "01/15/1990" or "1990-01-15"
    const datePatterns = [
      /\d{4}-\d{2}-\d{2}/,  // ISO format
      /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/, // MM/DD/YYYY or similar
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i,
    ];

    for (const pattern of datePatterns) {
      const match = cleaned.match(pattern);
      if (match) {
        return match[0];
      }
    }
  }

  // For select fields, try to match against options
  if (field.type === 'select' && field.options) {
    const lowerResponse = cleaned.toLowerCase();
    for (const option of field.options) {
      if (lowerResponse.includes(option.label.toLowerCase()) ||
          lowerResponse.includes(option.value.toLowerCase())) {
        return option.value;
      }
    }
  }

  // Clean up common endings
  cleaned = cleaned.replace(/[.,;!?]+$/, '');

  // Capitalize first letter for name fields
  if (field.id.toLowerCase().includes('name') || field.label.toLowerCase().includes('name')) {
    cleaned = cleaned
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  return cleaned;
}

export function calculateProgress(
  template: FormTemplate,
  data: FormData
): { percent: number; missingRequired: number } {
  const allFields = template.sections.flatMap(section => section.fields);
  const requiredFields = allFields.filter(field => field.required);

  const filledRequired = requiredFields.filter(field => {
    const value = data[field.id];
    return value !== undefined && value !== null && value !== '';
  }).length;

  const missingRequired = requiredFields.length - filledRequired;
  const percent = requiredFields.length > 0
    ? Math.round((filledRequired / requiredFields.length) * 100)
    : 100;

  return { percent, missingRequired };
}

export function getNextMissingField(
  template: FormTemplate,
  data: FormData,
  currentFieldId?: string,
  skippedFields: string[] = []
): FormField | null {
  const allFields = template.sections.flatMap(section => section.fields);

  // If we have a current field, find the next field after it
  if (currentFieldId) {
    const currentIndex = allFields.findIndex(f => f.id === currentFieldId);
    if (currentIndex >= 0) {
      // Look for the next missing required field after the current one
      for (let i = currentIndex + 1; i < allFields.length; i++) {
        const field = allFields[i];
        if (field.required && !skippedFields.includes(field.id)) {
          const value = data[field.id];
          if (value === undefined || value === null || value === '') {
            return field;
          }
        }
      }
    }
  }

  // If no field found after current, start from the beginning (excluding skipped)
  for (const field of allFields) {
    if (field.required && !skippedFields.includes(field.id)) {
      const value = data[field.id];
      if (value === undefined || value === null || value === '') {
        return field;
      }
    }
  }

  return null;
}

export function validateField(field: FormField, value: string | string[]): string | null {
  if (field.required && (!value || value === '')) {
    return `${field.label} is required`;
  }

  if (!value || value === '') {
    return null;
  }

  const stringValue = Array.isArray(value) ? value.join(',') : value;

  if (field.type === 'email') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(stringValue)) {
      return 'Please enter a valid email address';
    }
  }

  if (field.type === 'phone') {
    const phonePattern = /^\+?[\d\s\-()]+$/;
    if (!phonePattern.test(stringValue)) {
      return 'Please enter a valid phone number';
    }
  }

  if (field.validation?.pattern) {
    const regex = new RegExp(field.validation.pattern);
    if (!regex.test(stringValue)) {
      return field.validation.message || 'Invalid format';
    }
  }

  if (field.type === 'number' && field.validation) {
    const numValue = parseFloat(stringValue);
    if (field.validation.min !== undefined && numValue < field.validation.min) {
      return `Minimum value is ${field.validation.min}`;
    }
    if (field.validation.max !== undefined && numValue > field.validation.max) {
      return `Maximum value is ${field.validation.max}`;
    }
  }

  return null;
}

export function validateAllFields(
  template: FormTemplate,
  data: FormData
): ValidationError[] {
  const errors: ValidationError[] = [];
  const allFields = template.sections.flatMap(section => section.fields);

  for (const field of allFields) {
    const value = data[field.id];
    const error = validateField(field, value);
    if (error) {
      errors.push({ fieldId: field.id, message: error });
    }
  }

  return errors;
}

export function generateSummary(template: FormTemplate, data: FormData): string {
  console.log('generateSummary called with template:', template.name, 'and data:', data);
  const lines: string[] = [`${template.name} Summary`, `Generated: ${new Date().toLocaleString()}`, ''];

  let fieldsIncluded = 0;
  for (const section of template.sections) {
    lines.push(`${section.title}:`);
    let sectionHasData = false;
    for (const field of section.fields) {
      const value = data[field.id];
      if (value) {
        const displayValue = Array.isArray(value) ? value.join(', ') : value;
        lines.push(`  ${field.label}: ${displayValue}`);
        fieldsIncluded++;
        sectionHasData = true;
      }
    }
    if (!sectionHasData) {
      lines.push('  (No data provided)');
    }
    lines.push('');
  }

  console.log(`Summary generated with ${fieldsIncluded} fields`);
  return lines.join('\n');
}

export function parseAddressComponents(fullAddress: string): {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
} {
  if (!fullAddress) return {};

  const components: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } = {};

  const zipPattern = /\b\d{5}(?:-\d{4})?\b/;
  const zipMatch = fullAddress.match(zipPattern);
  if (zipMatch) {
    components.zip = zipMatch[0];
  }

  const statePattern = /\b([A-Z]{2})\b/;
  const parts = fullAddress.split(',').map(p => p.trim());

  if (parts.length >= 3) {
    components.street = parts[0];

    const lastPart = parts[parts.length - 1];
    const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);

    if (stateZipMatch) {
      components.state = stateZipMatch[1];
      components.zip = stateZipMatch[2];
      components.city = parts[parts.length - 2];
    } else {
      const secondToLast = parts[parts.length - 2];
      const stateMatch = secondToLast.match(statePattern);
      if (stateMatch) {
        components.state = stateMatch[1];
        components.city = parts[parts.length - 3] || parts[parts.length - 2].replace(statePattern, '').trim();
      } else {
        components.city = parts[parts.length - 2];
      }
    }
  } else if (parts.length === 2) {
    components.street = parts[0];
    const lastPart = parts[1];
    const stateZipMatch = lastPart.match(/([A-Za-z\s]+),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
    if (stateZipMatch) {
      components.city = stateZipMatch[1].trim();
      components.state = stateZipMatch[2];
      components.zip = stateZipMatch[3];
    }
  }

  return components;
}
