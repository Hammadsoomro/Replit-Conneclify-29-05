import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import type { Conversation } from "@shared/schema";
import { AnimatedLogo } from "@/components/animated-logo";
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Phone,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Zap,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Conversations",
    url: "/conversations",
    icon: MessageSquare,
  },
  {
    title: "SMS Blasting",
    url: "/sms-blasting",
    icon: Zap,
  },
  {
    title: "Messaging Insights",
    url: "/insights",
    icon: BarChart3,
  },
  {
    title: "Bought Numbers",
    url: "/bought-numbers",
    icon: Phone,
  },
  {
    title: "Buy Numbers",
    url: "/buy-numbers",
    icon: ShoppingCart,
  },
  {
    title: "Team Management",
    url: "/team",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { state } = useSidebar();

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    refetchInterval: 30000,
  });

  // Only count unread for conversations NOT assigned to team members (i.e., admin's own or unassigned)
  const totalUnreadCount = conversations
    .filter(conv => !conv.assignedUserId || conv.assignedUserId === user?.id)
    .reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="w-full">
              <AnimatedLogo size="md" />
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Conneclify</span>
                <span className="text-xs text-muted-foreground">SMS Platform</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => {
                const isActive = location === item.url;
                const isOnConversationsPage = location === "/conversations";
                const showBadge = item.url === "/conversations" && totalUnreadCount > 0 && !isOnConversationsPage;
                return (
                  <SidebarMenuItem key={item.title}>
                    <Link href={item.url}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {showBadge && (
                          <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center text-xs">
                            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user?.fullName ? getInitials(user.fullName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none text-left">
                    <span className="font-medium truncate max-w-[120px]">{user?.fullName}</span>
                    <span className="text-xs text-muted-foreground capitalize">{user?.role?.replace("_", " ")}</span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={state === "collapsed" ? "right" : "top"}
                align="start"
                className="w-56"
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer" data-testid="menu-settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="menu-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
