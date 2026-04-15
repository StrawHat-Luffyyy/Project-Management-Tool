import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FolderKanban, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuthStore();
  const {
    workspaces,
    activeWorkspace,
    projects,
    fetchWorkspaces,
    createWorkspace,
    createProject,
    isLoading,
  } = useWorkspaceStore();

  // Dialog states
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Form states
  const [wsName, setWsName] = useState("");
  const [projName, setProjName] = useState("");
  const [projKey, setProjKey] = useState("");

  // Fetch data on mount
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    const success = await createWorkspace(wsName, "My workspace");
    if (success) {
      setIsWorkspaceModalOpen(false);
      setWsName("");
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const success = await createProject(projName, projKey, "New project");
    if (success) {
      setIsProjectModalOpen(false);
      setProjName("");
      setProjKey("");
    }
  };

  if (isLoading)
    return <div className="p-8 text-slate-500">Loading your data...</div>;

  // SCENARIO 1: User has no workspaces
  if (workspaces.length === 0) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center">
        <div className="rounded-full bg-blue-100 p-6 text-blue-600 mb-6">
          <FolderKanban className="h-12 w-12" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome to JiraClone, {user?.name?.split(" ")[0]}!
        </h2>
        <p className="text-slate-500 mb-8 max-w-md">
          To get started, you need to create a Workspace. This is where your
          team and all your projects will live.
        </p>

        <Dialog
          open={isWorkspaceModalOpen}
          onOpenChange={setIsWorkspaceModalOpen}
        >
          <DialogTrigger asChild>
            <Button size="lg">Create Your First Workspace</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
              <DialogDescription>
                Give your workspace a name (e.g., Acme Corp or Engineering
                Team).
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateWorkspace} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="wsName">Workspace Name</Label>
                <Input
                  id="wsName"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Create
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // SCENARIO 2: User has a workspace, show projects
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {activeWorkspace?.name}
          </h1>
          <p className="text-slate-500 mt-1">Manage your projects and tasks.</p>
        </div>

        <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Projects contain your Kanban boards and sprints.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="projName">Project Name</Label>
                <Input
                  id="projName"
                  placeholder="e.g., Frontend Redesign"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projKey">Project Key (Prefix for tasks)</Label>
                <Input
                  id="projKey"
                  placeholder="e.g., FE"
                  value={projKey}
                  onChange={(e) => setProjKey(e.target.value.toUpperCase())}
                  maxLength={5}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Create Project
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            No projects yet
          </h3>
          <p className="text-slate-500 mt-1">
            Create your first project to start tracking tasks.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>Key: {project.key}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">
                    Click to view Kanban board
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
