import { AIAnalysisResult } from '../../types/ai';

/**
 * MindChat Neural Engine
 * Extracts structured intelligence, classifies messages, identifies deadlines,
 * meetings, tasks, reminders, and decisions.
 */
export function analyzeMessageWithAI(content: string): AIAnalysisResult {
  const text = content.trim();
  const lower = text.toLowerCase();

  // Pattern detection for casual chat (not important)
  const casualPatterns = [
    /^(hi|hello|hey|sup|yo|good\s*(morning|night|evening)|how\s*are\s*you|what('?s|\s+is)\s*up|wassup|ok|okay|cool|nice|lol|haha|bye|see\s*ya)\b/i,
    /^(what\s*are\s*you\s*doing|k|hru|gn|gm|thanks|thank\s*you)\b/i,
  ];

  for (const pattern of casualPatterns) {
    if (pattern.test(lower) && text.length < 50) {
      return {
        classification: 'casual',
        confidence: 0.95,
        isImportant: false,
        reasoning: 'Everyday casual conversation or greeting',
      };
    }
  }

  // Detect Deadlines & Urgent submissions
  const deadlineMatch = lower.match(/(deadline|due|submit|submission|before|by|strictly)\s+(at|on|by)?\s*(\d{1,2}(:\d{2})?\s*(am|pm)?|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (deadlineMatch || lower.includes('deadline') || lower.includes('due date')) {
    // Extract date and time
    const timeMatch = text.match(/\b\d{1,2}(:\d{2})?\s*(am|pm)\b/i);
    const dateMatch = text.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|oct(ober)?\s*\d{1,2}|nov(ember)?\s*\d{1,2})\b/i);

    return {
      classification: 'deadline',
      confidence: 0.94,
      isImportant: true,
      extractedData: {
        title: extractTitle(text, 'Project / Assignment Deadline'),
        date: dateMatch ? capitalize(dateMatch[0]) : 'Upcoming',
        time: timeMatch ? timeMatch[0].toUpperCase() : undefined,
        priority: 'high',
        category: 'deadlines',
        action_item: text,
      },
      reasoning: 'Contains explicit deadline or delivery timeline',
    };
  }

  // Detect Events & Meetings & Reviews
  const eventKeywords = ['meeting', 'review', 'seminar', 'presentation', 'call', 'interview', 'demo', 'session', 'standup', 'conference'];
  const hasEventKeyword = eventKeywords.some(k => lower.includes(k));
  const hasTimeOrDate = /\b(\d{1,2}(:\d{2})?\s*(am|pm)|tomorrow|today|at\s+\d{1,2})\b/i.test(lower);

  if (hasEventKeyword && (hasTimeOrDate || lower.includes('scheduled') || lower.includes('seminar hall') || lower.includes('room'))) {
    const timeMatch = text.match(/\b\d{1,2}(:\d{2})?\s*(am|pm)\b/i);
    const dateMatch = text.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);

    return {
      classification: 'event',
      confidence: 0.96,
      isImportant: true,
      extractedData: {
        title: extractTitle(text, 'Meeting / Event'),
        event: extractEventName(text),
        date: dateMatch ? capitalize(dateMatch[0]) : 'Upcoming',
        time: timeMatch ? timeMatch[0].toUpperCase() : 'TBD',
        priority: 'high',
        category: 'events',
        action_item: text,
      },
      reasoning: 'Contains scheduled meeting, review, or calendar event',
    };
  }

  // Detect Actionable Tasks & Assignments
  const taskKeywords = ['please complete', 'need to finish', 'finish the', 'ppt needs', 'upload the', 'deploy', 'send the document', 'assigned to', 'make sure'];
  if (taskKeywords.some(k => lower.includes(k))) {
    return {
      classification: 'task',
      confidence: 0.91,
      isImportant: true,
      extractedData: {
        title: extractTitle(text, 'Actionable Task'),
        priority: lower.includes('urgent') || lower.includes('asap') ? 'high' : 'medium',
        category: 'tasks',
        action_item: text,
      },
      reasoning: 'Contains actionable work item or assignment',
    };
  }

  // Detect Decisions
  const decisionKeywords = ['finalized', 'agreed on', 'approved', 'decided to', 'confirmed that', 'we will go with'];
  if (decisionKeywords.some(k => lower.includes(k))) {
    return {
      classification: 'decision',
      confidence: 0.89,
      isImportant: true,
      extractedData: {
        title: extractTitle(text, 'Key Decision Finalized'),
        category: 'decisions',
        action_item: text,
      },
      reasoning: 'Represents a finalized team decision or consensus',
    };
  }

  // Detect Credentials / Critical access numbers
  if (lower.includes('passcode') || lower.includes('secret') || lower.includes('access key') || lower.includes('api key')) {
    return {
      classification: 'important',
      confidence: 0.88,
      isImportant: true,
      extractedData: {
        title: 'Sensitive Access Information',
        category: 'notes',
        action_item: text,
      },
      reasoning: 'Critical credential or access instruction',
    };
  }

  // Default to casual
  return {
    classification: 'casual',
    confidence: 0.85,
    isImportant: false,
    reasoning: 'Casual chat with no critical deadlines, tasks, or scheduled events',
  };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function extractTitle(text: string, fallback: string): string {
  // If text mentions "Project review", use that
  if (/project\s*review/i.test(text)) return 'Project Review';
  if (/presentation\s*ppt/i.test(text) || /deck/i.test(text)) return 'Presentation Deck';
  if (/assignment/i.test(text)) return 'Assignment Submission';
  if (/model architecture/i.test(text)) return 'Model Architecture';
  
  // Truncate first sentence up to 40 chars
  const firstSentence = text.split(/[.!?\n]/)[0];
  if (firstSentence && firstSentence.length <= 40) return firstSentence.trim();
  return fallback;
}

function extractEventName(text: string): string {
  if (/project\s*review/i.test(text)) return 'Project Review';
  if (/seminar/i.test(text)) return 'Seminar';
  if (/interview/i.test(text)) return 'Interview';
  return 'Scheduled Event';
}
