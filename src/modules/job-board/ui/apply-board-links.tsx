import { ExternalLink } from "lucide-react";
import { Button, Cluster } from "@/design-system";
import type { ApplyBoard } from "@/modules/job-board/apply-boards";

export function ApplyBoardLinks({ boards }: { boards: ApplyBoard[] }) {
  if (boards.length === 0) return null;
  return (
    <Cluster gap={2} className="flex-wrap">
      {boards.map((board) => (
        <Button
          key={board.id}
          asChild
          size="sm"
          variant={board.featured ? "primary" : "outline"}
        >
          <a href={board.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            {board.label}
          </a>
        </Button>
      ))}
    </Cluster>
  );
}
