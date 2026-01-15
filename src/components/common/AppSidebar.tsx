import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, useSession } from '@/lib/store/authStore';
import { getNavForRole } from '@/features/navigation/config';
import { roleDisplayNames } from '@/features/auth/schemas';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { usePendingAssignmentsCount } from '@/hooks/usePendingAssignmentsCount';
import { usePendingLessonRequestsCount } from '@/hooks/usePendingLessonRequestsCount';

export function AppSidebar() {
  const { state } = useSidebar();
  const session = useSession();
  const { logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useUnreadMessagesCount();
  const { pendingCount: pendingAssignmentsCount } = usePendingAssignmentsCount();
  const { pendingCount: pendingLessonRequestsCount } = usePendingLessonRequestsCount();

  if (!session) return null;

  const navSections = getNavForRole(session.role);
  const currentPath = location.pathname;
  const isCollapsed = state === 'collapsed';

  const isActive = (path: string) => currentPath === path;
  const getNavClassName = (path: string) =>
    isActive(path)
      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
      : 'hover:bg-sidebar-accent/50';

  const handleLogout = () => {
    logout();
    navigate('/auth/signin');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 border-b border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex items-center justify-center">
            <img 
              src="/M.B.E.S.T-logo.png" 
              alt="MBEST Logo" 
              className={`${isCollapsed ? 'h-10 w-10' : 'w-auto'} object-contain`}
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <h2 className="text-lg font-bold text-sidebar-foreground truncate">
                MBEST
              </h2>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                Learning Management System
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.title}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs uppercase tracking-wider">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={isCollapsed ? item.label : undefined}
                    >
                      <NavLink to={item.href}>
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            {(() => {
                              // For Messages, use real-time unread count
                              if (item.href.includes('/messaging') || item.href.includes('/messages')) {
                                return unreadCount > 0 ? (
                                  <Badge variant="default" className="ml-auto text-xs bg-blue-500 hover:bg-blue-600 text-white border-blue-600">
                                    {unreadCount}
                                  </Badge>
                                ) : null;
                              }
                              // For Assignments, use real-time pending count
                              if (item.href.includes('/assignments') && session.role === 'tutor') {
                                return pendingAssignmentsCount > 0 ? (
                                  <Badge variant="default" className="ml-auto text-xs bg-blue-500 hover:bg-blue-600 text-white border-blue-600">
                                    {pendingAssignmentsCount}
                                  </Badge>
                                ) : null;
                              }
                              // For Lesson Requests, use real-time pending count
                              if (item.href.includes('/lesson-requests') && session.role === 'tutor') {
                                return pendingLessonRequestsCount > 0 ? (
                                  <Badge variant="default" className="ml-auto text-xs bg-blue-500 hover:bg-blue-600 text-white border-blue-600">
                                    {pendingLessonRequestsCount}
                                  </Badge>
                                ) : null;
                              }
                              // For other items, use the badge from config (but don't show it, as we want real-time counts only)
                              return null;
                            })()}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage 
                      src={session.avatar ? (
                        session.avatar.startsWith('http') 
                          ? session.avatar 
                          : session.avatar.startsWith('/')
                          ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${session.avatar}`
                          : `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'}/storage/${session.avatar}`
                      ) : undefined} 
                      alt={session.name} 
                    />
                    <AvatarFallback className="text-xs">
                      {session.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <>
                      <div className="flex flex-1 flex-col text-left text-sm">
                        <span className="font-medium">{session.name}</span>
                        <span className="text-xs text-sidebar-foreground/70">
                          {roleDisplayNames[session.role]}
                        </span>
                      </div>
                      <ChevronDown className="ml-auto h-4 w-4" />
                    </>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="right" 
                align="end" 
                className="w-56"
              >
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={session.avatar ? (
                        session.avatar.startsWith('http') 
                          ? session.avatar 
                          : session.avatar.startsWith('/')
                          ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${session.avatar}`
                          : `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'}/storage/${session.avatar}`
                      ) : undefined} 
                      alt={session.name} 
                    />
                    <AvatarFallback>
                      {session.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{session.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {session.email}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile/settings')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}