import { Role } from '@/components/RoleCard';

export interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const questionBank: Record<Role, Question[]> = {
  frontend: [
    {
      id: 'fe-1',
      text: 'Can you explain the difference between React state and props? When would you use each?',
      category: 'React Fundamentals',
      difficulty: 'easy',
    },
    {
      id: 'fe-2',
      text: 'How would you optimize a React application that is experiencing performance issues?',
      category: 'Performance',
      difficulty: 'medium',
    },
    {
      id: 'fe-3',
      text: 'Describe a challenging UI component you built. What were the technical decisions you made?',
      category: 'Experience',
      difficulty: 'medium',
    },
    {
      id: 'fe-4',
      text: 'How do you ensure accessibility in your web applications? Give specific examples.',
      category: 'Accessibility',
      difficulty: 'medium',
    },
    {
      id: 'fe-5',
      text: 'Explain the CSS box model and how it affects layout. How does Flexbox differ from Grid?',
      category: 'CSS',
      difficulty: 'easy',
    },
    {
      id: 'fe-6',
      text: 'What is your approach to testing React components? What tools and strategies do you use?',
      category: 'Testing',
      difficulty: 'hard',
    },
    {
      id: 'fe-7',
      text: 'How do you handle API calls and state management in a large React application?',
      category: 'Architecture',
      difficulty: 'hard',
    },
    {
      id: 'fe-8',
      text: 'Tell me about a time when you had to work with a difficult team member. How did you handle it?',
      category: 'Behavioral',
      difficulty: 'medium',
    },
  ],
  backend: [
    {
      id: 'be-1',
      text: 'Explain RESTful API design principles. How do you ensure your APIs are well-designed?',
      category: 'API Design',
      difficulty: 'easy',
    },
    {
      id: 'be-2',
      text: 'How would you design a database schema for a social media application with posts and comments?',
      category: 'Database Design',
      difficulty: 'medium',
    },
    {
      id: 'be-3',
      text: 'Describe how you would implement authentication and authorization in a web application.',
      category: 'Security',
      difficulty: 'medium',
    },
    {
      id: 'be-4',
      text: 'How do you handle errors and logging in production systems? What monitoring do you use?',
      category: 'Operations',
      difficulty: 'medium',
    },
    {
      id: 'be-5',
      text: 'Explain the difference between SQL and NoSQL databases. When would you choose each?',
      category: 'Databases',
      difficulty: 'easy',
    },
    {
      id: 'be-6',
      text: 'How would you design a system that needs to handle 10,000 requests per second?',
      category: 'Scalability',
      difficulty: 'hard',
    },
    {
      id: 'be-7',
      text: 'Describe your experience with microservices. What are the trade-offs compared to monoliths?',
      category: 'Architecture',
      difficulty: 'hard',
    },
    {
      id: 'be-8',
      text: 'Tell me about a production incident you handled. What was your approach to debugging?',
      category: 'Behavioral',
      difficulty: 'medium',
    },
  ],
  'data-analyst': [
    {
      id: 'da-1',
      text: 'Walk me through your process for cleaning and preparing a messy dataset.',
      category: 'Data Cleaning',
      difficulty: 'easy',
    },
    {
      id: 'da-2',
      text: 'How would you explain a complex data finding to a non-technical stakeholder?',
      category: 'Communication',
      difficulty: 'medium',
    },
    {
      id: 'da-3',
      text: 'Describe a dashboard or visualization you created that drove business decisions.',
      category: 'Visualization',
      difficulty: 'medium',
    },
    {
      id: 'da-4',
      text: 'Write a SQL query to find the top 5 customers by total purchase amount in the last month.',
      category: 'SQL',
      difficulty: 'easy',
    },
    {
      id: 'da-5',
      text: 'How do you identify if correlation implies causation in your analysis?',
      category: 'Statistics',
      difficulty: 'medium',
    },
    {
      id: 'da-6',
      text: 'Describe your experience with A/B testing. How do you determine sample size and significance?',
      category: 'Experimentation',
      difficulty: 'hard',
    },
    {
      id: 'da-7',
      text: 'How would you approach forecasting sales for the next quarter using historical data?',
      category: 'Forecasting',
      difficulty: 'hard',
    },
    {
      id: 'da-8',
      text: 'Tell me about a time when your analysis challenged an existing assumption. What happened?',
      category: 'Behavioral',
      difficulty: 'medium',
    },
  ],
};

// Mock AI feedback generator (will be replaced with real AI)
export const generateMockFeedback = (answer: string) => {
  const wordCount = answer.split(' ').length;
  const hasExamples = answer.toLowerCase().includes('example') || answer.toLowerCase().includes('for instance');
  const hasStructure = answer.includes('first') || answer.includes('second') || answer.includes('then');
  
  const confidence = Math.min(95, Math.max(25, 40 + wordCount * 0.5 + (hasExamples ? 15 : 0)));
  const clarity = Math.min(95, Math.max(30, 35 + (hasStructure ? 20 : 0) + wordCount * 0.3));
  const depth = Math.min(90, Math.max(20, 25 + wordCount * 0.6 + (hasExamples ? 10 : 0)));
  const relevance = Math.min(95, Math.max(40, 50 + Math.random() * 30));

  const feedbacks = [
    "The candidate shows foundational knowledge but could provide more specific examples to demonstrate practical experience.",
    "Good structure in the response, but the answer could be strengthened with more technical depth and real-world scenarios.",
    "The response demonstrates understanding of concepts. Adding quantifiable results would make it more impactful.",
    "Clear communication style. Consider using the STAR method for behavioral questions to provide more context.",
    "Shows potential but needs more industry-specific terminology and concrete examples of past work.",
  ];

  const strongAnswers = [
    "A strong candidate would structure their answer using specific examples, mention tools they've used, and explain the impact of their decisions with measurable outcomes.",
    "An ideal response would include a specific project example, the challenges faced, the approach taken, and the quantifiable results achieved.",
    "Top candidates typically provide context, explain their thought process step-by-step, and connect their experience to the role requirements.",
  ];

  const missingElements = [];
  if (!hasExamples) missingElements.push('Specific examples');
  if (!hasStructure) missingElements.push('Clear structure');
  if (wordCount < 50) missingElements.push('More detail');
  if (!answer.toLowerCase().includes('result') && !answer.toLowerCase().includes('outcome')) {
    missingElements.push('Measurable outcomes');
  }
  missingElements.push('Industry keywords');

  return {
    perception: {
      confidence: Math.round(confidence),
      clarity: Math.round(clarity),
      depth: Math.round(depth),
      relevance: Math.round(relevance),
      feedback: feedbacks[Math.floor(Math.random() * feedbacks.length)],
    },
    strongAnswer: strongAnswers[Math.floor(Math.random() * strongAnswers.length)],
    missingElements: missingElements.slice(0, 4),
  };
};
