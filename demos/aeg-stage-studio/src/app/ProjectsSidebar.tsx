import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { FolderIcon, FolderOpenIcon, Icon, PlusIcon, RotateCcwIcon } from '@anvil/components/ui/icon'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@anvil/components/ui/sidebar'
import { IconTile } from '@anvil/components/anvil/icon-tile'
import { ImageIcon } from '@anvil/components/ui/icon'
import { projectStatusLabel } from '~/state/project'
import { useStore } from '~/state/store'

/** Every project, most recent first, like a chat history. Collapses to icons. */
export function ProjectsSidebar() {
  const { list, createProject, resetDemo } = useStore()
  const { projectId } = useParams()
  const navigate = useNavigate()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-1 py-1 group-data-[collapsible=icon]:px-0">
              <IconTile icon={ImageIcon} tone="agent" size="sm" />
              <span className="truncate type-text-sm-semibold group-data-[collapsible=icon]:hidden">Stage Studio</span>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="New project"
              onClick={() => navigate(`/p/${createProject()}/brief`)}
            >
              <Icon icon={PlusIcon} />
              <span>New project</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {/* Anvil pads the header 12px but content and footer 8px; match the header so every icon lines up,
          expanded and collapsed (where 12px centres the icons in the 56px rail). */}
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {list.map((p) => (
                <SidebarMenuItem key={p.meta.id}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={p.meta.id === projectId}
                    tooltip={`${p.meta.artist} · ${p.meta.event}`}
                    // Anvil's lg size drops all padding when collapsed (it expects a 32px avatar); a 16px icon needs the
                    // default 8px, like the other rows, so it centres in the 32px button.
                    className="group-data-[collapsible=icon]:p-2!"
                  >
                    <NavLink to={`/p/${p.meta.id}`} aria-label={`${p.meta.artist} · ${p.meta.event}, ${projectStatusLabel(p)}`}>
                      <Icon icon={p.meta.id === projectId ? FolderOpenIcon : FolderIcon} />
                      <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                        <span className="truncate type-text-sm-medium">
                          {p.meta.artist} · {p.meta.event}
                        </span>
                        <span className="text-muted-foreground truncate type-text-xs-normal">{projectStatusLabel(p)}</span>
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Reset the demo"
              onClick={() => {
                resetDemo()
                navigate('/')
              }}
            >
              <Icon icon={RotateCcwIcon} />
              <span>Reset the demo</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
