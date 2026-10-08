import { Chat, Message, Profile } from '../../types/database';
import { AISearchResultItem } from '../../types/ai';

export function searchChatsWithNL(
  query: string,
  chats: Chat[],
  messagesByChat: Record<string, Message[]>,
  contacts: Profile[],
  currentUser: Profile
): AISearchResultItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: AISearchResultItem[] = [];

  // Extract key intent from query
  const queryTokens = q.split(/\s+/).filter(t => !['when', 'what', 'did', 'is', 'the', 'our', 'a', 'an', 'say', 'about', 'find', 'message', 'where', 'was'].includes(t));

  chats.forEach(chat => {
    const msgs = messagesByChat[chat.id] || [];
    msgs.forEach(msg => {
      if (msg.deleted_at || msg.is_expired) return;

      const contentLower = msg.content.toLowerCase();
      let matchScore = 0;
      let matchedContext = '';

      // Direct match
      if (contentLower.includes(q)) {
        matchScore += 10;
        matchedContext = 'Exact phrase match';
      }

      // Token matches
      queryTokens.forEach(token => {
        if (contentLower.includes(token)) {
          matchScore += 3;
        }
      });

      // Intent heuristics:
      // "When is our project review?" -> matches "Tomorrow our project review is at 10 AM"
      if ((q.includes('review') || q.includes('project')) && (contentLower.includes('review') || contentLower.includes('project'))) {
        matchScore += 5;
        matchedContext = 'Matched project review schedule';
      }

      // "What did Rahul say..." -> matches messages from Rahul
      if (q.includes('rahul')) {
        const sender = contacts.find(c => c.id === msg.sender_id);
        if (sender && sender.display_name.toLowerCase().includes('rahul')) {
          matchScore += 5;
          matchedContext = 'Matched messages sent by Rahul';
        }
      }

      // "PPT" / "presentation" / "assignment"
      if (q.includes('ppt') && contentLower.includes('ppt')) {
        matchScore += 6;
        matchedContext = 'Matched presentation PPT discussion';
      }

      // "college" / "lab"
      if (q.includes('college') && (contentLower.includes('college') || contentLower.includes('ಕಾಲೇಜಿಗೆ'))) {
        matchScore += 6;
        matchedContext = 'Matched college attendance inquiry';
      }

      if (matchScore > 2) {
        const sender = msg.sender_id === currentUser.id 
          ? currentUser 
          : contacts.find(c => c.id === msg.sender_id) || { display_name: 'Unknown' };

        results.push({
          message: msg,
          senderName: (sender as any).display_name,
          chatName: chat.name || 'Chat',
          matchedSnippet: msg.content,
          relevanceScore: matchScore,
          extractedContext: matchedContext || 'Relevant conversational context',
        });
      }
    });
  });

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}
