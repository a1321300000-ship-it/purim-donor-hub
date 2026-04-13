import { Users, UserPlus, GraduationCap, ChevronDown, Settings, List, UserCheck, UserRoundPlus, Archive, MapPin, LayoutList, Map } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const donorSubItems = [
  { title: "רשימת תורמים", url: "/", icon: List },
  { title: "הוסף תורם", url: "/add-donor", icon: UserPlus },
  { title: "ארכיון", url: "/donor-archive", icon: Archive },
];

const bachurimSubItems = [
  { title: "רשימת בחורים", url: "/bachurim", icon: List },
  { title: "הוסף בחור", url: "/add-bachur", icon: UserRoundPlus },
];

const mappingSubItems = [
  { title: "מיפוי תורמים", url: "/donor-mapping", icon: MapPin },
  { title: "ניהול קבוצות", url: "/groups", icon: LayoutList },
  { title: "שיבוץ בחורים", url: "/bachurim-assign", icon: UserCheck },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isDonorSection = location.pathname === "/" || location.pathname === "/add-donor" || location.pathname === "/donor-archive";
  const isBachurimSection = location.pathname === "/bachurim" || location.pathname === "/add-bachur";
  const isMappingSection = location.pathname === "/donor-mapping" || location.pathname === "/groups" || location.pathname === "/bachurim-assign";

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          {!collapsed && <h2 className="text-lg font-bold text-sidebar-foreground">מגבית פורים</h2>}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible defaultOpen={isDonorSection} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="font-medium">
                      <Users className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">ניהול תורמים</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!collapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {donorSubItems.map((item) => (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={item.url} end className="flex items-center gap-2 hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible defaultOpen={isBachurimSection} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="font-medium">
                      <GraduationCap className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">ניהול בחורים</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!collapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {bachurimSubItems.map((item) => (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={item.url} end className="flex items-center gap-2 hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible defaultOpen={isMappingSection} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="font-medium">
                      <Map className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">מיפוי וקבוצות</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!collapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {mappingSubItems.map((item) => (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={item.url} end className="flex items-center gap-2 hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/data-settings" end className="flex items-center gap-2 hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                    <Settings className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>הגדרות</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
