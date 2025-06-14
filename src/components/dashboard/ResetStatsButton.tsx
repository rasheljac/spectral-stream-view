
import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ResetStatsButtonProps {
  onReset: () => void;
  show?: boolean;
}

const ResetStatsButton: React.FC<ResetStatsButtonProps> = ({ onReset, show = true }) => {
  const { toast } = useToast();

  if (!show) return null;

  // Optionally you could add a confirmation step here

  const handleClick = () => {
    onReset();
    toast({
      title: "Statistics Reset",
      description: "Scan statistics have been reset.",
    });
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className="h-10 md:ml-4 mt-2 md:mt-0 self-end"
      data-testid="reset-stats-btn"
    >
      Reset Stats
    </Button>
  );
};

export default ResetStatsButton;
