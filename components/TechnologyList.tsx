import React from 'react';
import { Cpu, Layout, Server, Database, Sparkles, CreditCard, Cloud } from 'lucide-react';
import { TechStack } from '../types.js';

interface TechnologyListProps {
  techStack: TechStack;
  platform: string;
}

const TechnologyList: React.FC<TechnologyListProps> = ({ techStack, platform }) => {
  const safeTechStack = techStack || {};
  const sections = [
    { title: 'Frontend & UI', items: safeTechStack.frontend || [], icon: Layout, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { title: 'Backend Services', items: safeTechStack.backend || [], icon: Server, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { title: 'Database & Data', items: safeTechStack.database || [], icon: Database, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { title: 'AI & Inference', items: safeTechStack.aiModels || [], icon: Sparkles, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { title: 'Hosting & Infrastructure', items: safeTechStack.hosting || [], icon: Cloud, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { title: 'Payment Gateways', items: safeTechStack.payments || [], icon: CreditCard, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  ].filter((sec) => sec.items && sec.items.length > 0);

  return (
    <div className="bg-white border border-[#E2DDD3] rounded-2xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-[#E2DDD3]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#2C2A26] text-[#F5F2EB] rounded-xl">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-[#2C2A26]">
              Technology Architecture & Stack
            </h3>
            <p className="text-xs text-[#5D5A53]">
              Frameworks, SDKs, AI pipelines, and third-party API integrations
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-[#F5F2EB] text-[#2C2A26] border border-[#E2DDD3] rounded-lg">
          Primary: {platform}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec, idx) => {
          const Icon = sec.icon;
          return (
            <div
              key={idx}
              className="bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl p-4 space-y-2.5 hover:border-[#2C2A26] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${sec.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2A26]">
                  {sec.title}
                </h4>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {sec.items?.map((item, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-2.5 py-1 bg-white border border-[#E2DDD3] text-[#2C2A26] rounded-lg shadow-2xs"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TechnologyList;
