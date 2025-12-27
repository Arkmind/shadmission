import { IconChartLine, IconGauge, IconSettings } from "@tabler/icons-react";
import { Link } from "react-router";
import { useTheme } from "../theme-provider/use-theme";
import { Separator } from "../ui/separator";
import { AddTorrentDialog } from "./add-torrent-dialog";
import { NavItem } from "./nav-item";
import { SpeedLimitMenu } from "./speed-limit-menu";
import { ThemeToggle } from "./theme-toggle";
import logoBlack from "/black.svg";
import variableLogo from "/logo.svg";
import logoWhite from "/white.svg";

const navItems = [
  { icon: <IconGauge className="size-5" />, label: "Dashboard", href: "/" },
  {
    icon: <IconChartLine className="size-5" />,
    label: "Graph",
    href: "/graph",
  },
  {
    icon: <IconSettings className="size-5" />,
    label: "Settings",
    href: "/settings",
  },
];

export const Navbar: React.FC = () => {
  const { theme } = useTheme();
  const logoSvg =
    theme === "dark"
      ? logoWhite
      : theme === "system"
      ? variableLogo
      : logoBlack;

  return (
    <nav className="flex flex-col items-center py-0 h-full">
      <div>
        <Link to={"/"}>
          <img
            src={logoSvg}
            alt="Shadmission Logo"
            className="size-8 pb-0 pt-2.5"
          />
        </Link>
      </div>

      <Separator orientation="horizontal" className="w-1/2! my-4" />

      <div className="flex flex-col items-center space-y-2">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col items-center space-y-2">
        <AddTorrentDialog />
        <SpeedLimitMenu />
        <Separator orientation="horizontal" className="w-1/2!" />
        <ThemeToggle />
      </div>
    </nav>
  );
};
