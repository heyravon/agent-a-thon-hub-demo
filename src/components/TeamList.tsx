import { motion } from 'framer-motion';
import { Check, Star, Users, Lock, Trophy, Zap } from 'lucide-react';
import { useJudging } from '@/context/JudgingContext';
import { Button } from '@/components/ui/button';
import { FINALISTS_COUNT, FINAL_ROUNDS, ADVANCEMENT_MAP, ROUND_LABELS } from '@/types/judging';

interface TeamListProps {
  onSelectTeam: (teamNumber: number) => void;
}

export function TeamList({ onSelectTeam }: TeamListProps) {
  const { currentRound, getScoredTeams, teams, getLeaderboard, getAssignedTeams, getJudgePartner, isAdmin, getDisplayTeamNumber } = useJudging();
  const scoredTeams = getScoredTeams(currentRound);
  const assignedTeams = getAssignedTeams(currentRound);
  const partner = getJudgePartner(currentRound);

  const isFinalRound = FINAL_ROUNDS.includes(currentRound);
  const sourceRound = ADVANCEMENT_MAP[currentRound];
  const primaryRankings = sourceRound ? getLeaderboard(sourceRound) : [];
  const finalistNumbers = primaryRankings.slice(0, FINALISTS_COUNT).map(r => r.teamNumber);

  let teamNumbers = teams.map(t => t.teamNumber).sort((a, b) => a - b);

  if (isFinalRound && finalistNumbers.length > 0) {
    teamNumbers = finalistNumbers;
  }

  const hasAssignments = assignedTeams.length > 0;

  const getTeamLabel = (num: number) => {
    const team = teams.find(t => t.teamNumber === num);
    const displayNum = getDisplayTeamNumber(num);
    return team ? `Team ${displayNum}: ${team.teamName}` : `Team ${displayNum}`;
  };

  const renderTeamCard = (num: number, i: number, isAssigned: boolean) => {
    const scored = scoredTeams.includes(num);
    const team = teams.find(t => t.teamNumber === num);
    const canScore = isAdmin || !hasAssignments || isAssigned;
    const finalistRank = isFinalRound ? finalistNumbers.indexOf(num) + 1 : 0;

    return (
      <motion.div
        key={num}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0, delay: i * 0.02 }}
        whileHover={canScore ? { scale: 1.01 } : undefined}
        className={`flex items-center justify-between rounded-xl p-4 card-shadow transition-shadow ${
          !canScore
            ? 'bg-muted/40 opacity-60'
            : isFinalRound
              ? 'bg-card ring-1 ring-ms-blue/20 hover:ring-ms-blue/40 hover:card-shadow-hover'
              : isAssigned
                ? 'bg-card ring-1 ring-primary/30 hover:card-shadow-hover'
                : 'bg-card hover:card-shadow-hover'
        }`}
      >
        <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-3">
          <div className="flex items-center gap-1.5">
            {isFinalRound && finalistRank > 0 && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-ms-blue text-[10px] font-bold text-primary-foreground shrink-0">
                {finalistRank}
              </span>
            )}
            {!isFinalRound && isAssigned && <Star className="h-3.5 w-3.5 text-primary shrink-0 fill-primary" />}
            {!canScore && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
            <span className={`text-base font-semibold truncate ${canScore ? 'text-foreground' : 'text-muted-foreground'}`}>
              {getTeamLabel(num)}
            </span>
          </div>
          {team && (
            <span className="text-xs text-muted-foreground truncate">{team.projectName}</span>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            {scored ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                <Check className="h-3 w-3" /> Scored
              </span>
            ) : !canScore ? (
              <span className="text-xs text-muted-foreground">Not assigned to you</span>
            ) : (
              <span className="text-xs text-muted-foreground">Not yet scored</span>
            )}
          </div>
        </div>
        {canScore ? (
          <Button
            onClick={() => onSelectTeam(num)}
            variant={scored ? 'outline' : 'default'}
            size="sm"
            className={`h-9 rounded-lg px-4 text-sm shrink-0 ${
              !scored && isFinalRound ? 'bg-ms-blue hover:bg-ms-blue/90 border-0' : ''
            }`}
          >
            {scored ? 'Edit Score' : 'Judge Team'}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground shrink-0">🔒</span>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-2">
      {isFinalRound ? (
        <>
          <div className="rounded-xl bg-gradient-to-r from-ms-blue/10 via-ms-green/10 to-ms-yellow/10 border border-ms-blue/20 p-3 mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-ms-blue" />
              <span className="text-sm font-semibold text-foreground">Finals — Top {FINALISTS_COUNT} Teams</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {scoredTeams.length}/{teamNumbers.length} scored
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Score all finalist teams. Every judge's score counts.</p>
          </div>
          {teamNumbers.map((num, i) => renderTeamCard(num, i, true))}
        </>
      ) : hasAssignments ? (
        <>
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 mb-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary fill-primary" />
              <span className="text-sm font-semibold text-foreground">Your Assigned Teams</span>
              <span className="ml-auto text-xs text-muted-foreground">{assignedTeams.filter(n => scoredTeams.includes(n)).length}/{assignedTeams.length} scored</span>
            </div>
            {partner && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                Judging with <span className="font-medium text-foreground">{partner}</span>
              </div>
            )}
          </div>
          {assignedTeams.map((num, i) => renderTeamCard(num, i, true))}

          {teamNumbers.filter(n => !assignedTeams.includes(n)).length > 0 && (
            <div className="flex items-center gap-2 px-1 py-2 mt-4">
              <span className="text-xs font-medium text-muted-foreground">Other Teams</span>
              {!isAdmin && <span className="text-xs text-muted-foreground">(view only)</span>}
            </div>
          )}
          {teamNumbers.filter(n => !assignedTeams.includes(n)).map((num, i) => renderTeamCard(num, i, false))}
        </>
      ) : (
        <>
          <div className="rounded-xl bg-muted/50 border border-border p-3 mb-3">
            <p className="text-xs text-muted-foreground">No team assignments yet. The admin will assign teams to you shortly.</p>
          </div>
          {teamNumbers.map((num, i) => renderTeamCard(num, i, false))}
        </>
      )}
    </div>
  );
}
