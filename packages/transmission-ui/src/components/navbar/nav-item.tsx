import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
}

export const NavItem: React.FC<NavItemProps> = ({ icon, label, href }) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to={href}>
          <Button
            variant={isActive ? "secondary" : "ghost"}
            size="icon"
            className={cn(
              "size-10",
              isActive && "bg-secondary text-secondary-foreground"
            )}
          >
            {icon}
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
};
