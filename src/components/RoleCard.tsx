import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Code, Database, BarChart3, Check } from 'lucide-react';

export type Role = 'frontend' | 'backend' | 'data-analyst';

interface RoleCardProps {
  role: Role;
  isSelected: boolean;
  onSelect: (role: Role) => void;
}

const roleData = {
  frontend: {
    title: 'Frontend Developer',
    description: 'Build beautiful user interfaces and web experiences',
    icon: Code,
    gradient: 'from-primary/20 to-secondary/10',
    borderColor: 'border-primary/40',
    skills: ['React', 'TypeScript', 'CSS', 'UI/UX'],
  },
  backend: {
    title: 'Backend Developer',
    description: 'Design scalable systems and APIs',
    icon: Database,
    gradient: 'from-secondary/20 to-accent/10',
    borderColor: 'border-secondary/40',
    skills: ['Node.js', 'Python', 'SQL', 'APIs'],
  },
  'data-analyst': {
    title: 'Data Analyst',
    description: 'Transform data into actionable insights',
    icon: BarChart3,
    gradient: 'from-accent/20 to-primary/10',
    borderColor: 'border-accent/40',
    skills: ['SQL', 'Python', 'Excel', 'Visualization'],
  },
};

const RoleCard: React.FC<RoleCardProps> = ({ role, isSelected, onSelect }) => {
  const data = roleData[role];
  const Icon = data.icon;

  return (
    <Card
      variant={isSelected ? 'glow' : 'glass'}
      className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
        isSelected ? `${data.borderColor} shadow-glow` : 'hover:border-primary/30'
      }`}
      onClick={() => onSelect(role)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${data.gradient}`}>
            <Icon className="w-6 h-6 text-foreground" />
          </div>
          {isSelected && (
            <div className="p-1.5 rounded-full bg-primary">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </div>
        
        <h3 className="font-display text-xl font-semibold mb-2">{data.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{data.description}</p>
        
        <div className="flex flex-wrap gap-2">
          {data.skills.map((skill) => (
            <span
              key={skill}
              className="px-2 py-1 text-xs font-medium rounded-lg bg-muted/50 text-muted-foreground"
            >
              {skill}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleCard;
