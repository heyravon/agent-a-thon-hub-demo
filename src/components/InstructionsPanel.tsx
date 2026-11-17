import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Brain, Zap, BookOpen, Plug, MessageSquare, Presentation, Trophy, Lightbulb, Users,
} from 'lucide-react';

const INSTRUCTIONS = [
  {
    title: 'What Judges Are Looking For',
    icon: <Trophy className="h-4 w-4" />,
    content: `Judges will prioritize solutions that demonstrate a clear concept, solid technical implementation, and a working demonstration.\n\nAgents that clearly show knowledge + connector execution working together will score highest.`,
  },
  {
    title: 'Clear and Practical Idea',
    icon: <Lightbulb className="h-4 w-4" />,
    content: `Your agent should solve a specific real-world problem relevant to students or professionals.\n\nJudges will look for:\n• A clearly defined user\n• A focused and practical use case\n• A solution that would realistically be useful\n\nExamples could include agents that help with:\n• Scheduling meetings\n• Organizing tasks or projects\n• Summarizing research\n• Preparing meeting agendas\n• Automating routine workplace tasks\n\nAgents that attempt to do too many things at once often struggle during demos. The best solutions focus on one meaningful task done well.`,
  },
  {
    title: 'Knowledge Source',
    icon: <BookOpen className="h-4 w-4" />,
    content: `Your agent must connect to a website OR a document.\n\nThe agent should clearly use this knowledge when responding to questions.\n\nJudges will look for responses that are grounded in the knowledge source rather than generic AI answers.`,
  },
  {
    title: 'Connector Action',
    icon: <Plug className="h-4 w-4" />,
    content: `Your agent must include at least one connector from the Copilot Studio ecosystem.\n\nThe connector should:\n• Be relevant to the use case\n• Be properly configured\n• Execute successfully during the demo\n\nCommon connectors used in short sprints include:\nOutlook, Outlook Calendar, Planner, SharePoint, Gmail.\n\nBecause the sprint is only 60 minutes, one reliable connector action is better than multiple partially working ones.`,
  },
  {
    title: 'System Prompt Quality',
    icon: <MessageSquare className="h-4 w-4" />,
    content: `Your system prompt should clearly define how the agent behaves.\n\nJudges will look for prompts that include:\n• Role Definition — Clearly state what the agent is responsible for\n• Knowledge Grounding — Instruct the agent to use the connected knowledge source when responding\n• Connector Usage — Clearly define when the agent should call a connector instead of generating text\n• Guardrails — Instruct the agent not to fabricate information outside the knowledge source\n\nClear prompts often lead to more reliable agent behavior during demos.`,
  },
  {
    title: 'Live Demo',
    icon: <Presentation className="h-4 w-4" />,
    content: `Each team will have exactly two minutes to present their agent.\n\nDuring your demo you should:\n• Briefly explain the problem your agent solves\n• Show the knowledge source used by your agent\n• Highlight the system prompt design\n• Run a live interaction with the agent\n• Demonstrate the connector executing successfully\n\nYour connector must successfully execute during the live demo.\n\nA simple agent that works reliably in the demo will score higher than a complex idea that fails during execution.`,
  },
  {
    title: 'Judging Rubric (100 Points)',
    icon: <Trophy className="h-4 w-4" />,
    content: `• Problem Definition & Idea — 20 pts\n  Clear user, specific and realistic use case, focused problem\n\n• System Prompt Design — 15 pts\n  Clear role definition, grounding instructions, connector usage guidance, guardrails\n\n• Knowledge Integration — 15 pts\n  Agent clearly uses the knowledge source; responses are grounded in it\n\n• Technical Execution (Connector) — 25 pts\n  Correct connector configuration and successful execution during the demo\n\n• Creativity & Innovation — 10 pts\n  Thoughtful design and creative use of knowledge and connectors\n\n• Demo & Communication — 15 pts\n  Clear explanation, confident walkthrough, successful live demonstration`,
  },
  {
    title: 'Competition Format',
    icon: <Users className="h-4 w-4" />,
    content: `The Agent Sprint takes place in two judging rounds.\n\n🔵 Primary Judging Round\nAfter the build sprint, teams will demo their agents to judges. Teams will have approximately 2 minutes to demonstrate their solution and show their agent working. Judges will score all teams using the official rubric. Because the number of teams may be large, this first round helps identify the strongest solutions.\n\n🏆 Final Round (Top 8 Teams)\nAfter the primary judging round, the top 8 teams based on judging scores will advance to the final round. These teams will present their agents in front of the entire room. Finalists will give a short presentation and demonstration of their agent for the judges and audience. The final round will determine the overall winners of the Agent-a-Thon.`,
  },
  {
    title: 'Key Advice',
    icon: <Zap className="h-4 w-4" />,
    content: `Because the sprint is only 60 minutes, teams should prioritize:\n\n• A clear and practical idea\n• One reliable connector action\n• A demo that works live\n\nThe most successful teams typically focus on clarity, simplicity, and execution.`,
  },
];

export function InstructionsPanel() {
  const [openSection, setOpenSection] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Hero banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Agent Sprint Builder Guide</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Build an AI agent that can <strong className="text-foreground">Think</strong> (retrieve knowledge) and{' '}
              <strong className="text-foreground">Act</strong> (execute a connector) — all in 60 minutes.
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Sprint', value: '60 min', icon: <Zap className="h-3.5 w-3.5" /> },
            { label: 'Demo', value: '2 min', icon: <Presentation className="h-3.5 w-3.5" /> },
            { label: 'Total', value: '100 pts', icon: <Trophy className="h-3.5 w-3.5" /> },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center rounded-xl bg-background/60 border border-border py-3 px-2">
              <span className="text-primary">{s.icon}</span>
              <span className="mt-1 text-base font-bold tabular-nums text-foreground">{s.value}</span>
              <span className="text-[11px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Accordion sections */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden card-shadow">
        {INSTRUCTIONS.map((section, i) => {
          const isOpen = openSection === i;
          return (
            <div key={i} className={i > 0 ? 'border-t border-border' : ''}>
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? null : i)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-secondary/40"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  {section.icon}
                </span>
                <span className="flex-1 text-sm font-semibold text-foreground">{section.title}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pl-[3.75rem]">
                      <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{section.content}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
