import type { Theme } from "@/components/theme-provider/theme-provider-context";
import { useTheme } from "@/components/theme-provider/use-theme";
import { cn } from "@/lib/utils";
import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface ThemeOption {
  value: Theme;
  label: string;
  icon: React.ReactNode;
}

const themeOptions: ThemeOption[] = [
  { value: "light", label: "Light", icon: <IconSun className="size-4 mr-2" /> },
  { value: "dark", label: "Dark", icon: <IconMoon className="size-4 mr-2" /> },
  {
    value: "system",
    label: "System",
    icon: <IconDeviceDesktop className="size-4 mr-2" />,
  },
];

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const currentIcon =
    theme === "dark" ? (
      <IconMoon className="size-5" />
    ) : theme === "light" ? (
      <IconSun className="size-5" />
    ) : (
      <IconDeviceDesktop className="size-5" />
    );

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-10">
              {currentIcon}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">Theme</TooltipContent>
      </Tooltip>
      <DropdownMenuContent side="right" align="end">
        {themeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(theme === option.value && "bg-accent font-medium")}
          >
            {option.icon}
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
