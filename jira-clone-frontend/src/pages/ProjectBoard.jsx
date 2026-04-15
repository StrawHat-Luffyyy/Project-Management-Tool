import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTaskStore } from "@/store/useTaskStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, GripVertical } from "lucide-react";

const COLUMNS = [
  { id: "TODO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "IN_REVIEW", title: "In Review" },
  { id: "DONE", title: "Done" },
];

export default function ProjectBoard() {
  const { projectId } = useParams();
  const {
    tasks,
    fetchTasks,
    createTask,
    reorderTask,
    setLocalTasks,
    isLoading,
  } = useTaskStore();
  const { projects } = useWorkspaceStore();

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");

  const currentProject = projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (projectId) fetchTasks(projectId);
  }, [projectId, fetchTasks]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const success = await createTask({
      projectId,
      title: newTaskTitle,
      priority: newTaskPriority,
      status: "TODO",
    });
    if (success) {
      setIsNewTaskModalOpen(false);
      setNewTaskTitle("");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-100 text-red-700";
      case "HIGH":
        return "bg-orange-100 text-orange-700";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700";
      case "LOW":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // Handling the drop event
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the board
    if (!destination) return;

    // Dropped in the exact same spot
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const originalTasks = [...tasks];
    const sourceTasks = tasks
      .filter((t) => t.status === source.droppableId)
      .sort((a, b) => a.listOrder - b.listOrder);
    const destTasks =
      source.droppableId === destination.droppableId
        ? sourceTasks
        : tasks
            .filter((t) => t.status === destination.droppableId)
            .sort((a, b) => a.listOrder - b.listOrder);

    // Remove the dragged task from the source list
    const [draggedTask] = sourceTasks.splice(source.index, 1);

    // Update its status to the new column
    draggedTask.status = destination.droppableId;

    // Insert it into the destination list
    destTasks.splice(destination.index, 0, draggedTask);

    // Reconstruct the full tasks array for the UI
    const unchangedTasks = tasks.filter(
      (t) =>
        t.status !== source.droppableId && t.status !== destination.droppableId,
    );
    const newLocalTasks =
      source.droppableId === destination.droppableId
        ? [...unchangedTasks, ...sourceTasks]
        : [...unchangedTasks, ...sourceTasks, ...destTasks];

    // Instantly update the UI
    setLocalTasks(newLocalTasks);

    // 3. Figure out the neighboring tasks for the backend math
    const prevTask =
      destination.index > 0 ? destTasks[destination.index - 1] : null;
    const nextTask =
      destination.index < destTasks.length - 1
        ? destTasks[destination.index + 1]
        : null;

    // 4. Fire the background API call
    reorderTask(
      draggableId,
      destination.droppableId,
      prevTask?.id,
      nextTask?.id,
      originalTasks,
    );
  };

  if (isLoading && tasks.length === 0)
    return <div className="p-8 text-slate-500">Loading board...</div>;

  return (
    <div className="flex h-full flex-col space-y-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="text-sm font-medium text-slate-500 mb-1">
            Projects / {currentProject?.key || "Board"}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {currentProject?.name || "Kanban Board"}
          </h1>
        </div>

        <Dialog open={isNewTaskModalOpen} onOpenChange={setIsNewTaskModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            {/* Same form as before */}
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTaskPriority}
                  onValueChange={setNewTaskPriority}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Create Task
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-1 gap-6 overflow-x-auto pb-4 items-start">
          {COLUMNS.map((column) => {
            // Sort tasks by our backend float value before rendering
            const columnTasks = tasks
              .filter((t) => t.status === column.id)
              .sort((a, b) => a.listOrder - b.listOrder);

            return (
              <div
                key={column.id}
                className="flex w-80 shrink-0 flex-col rounded-xl bg-slate-100/80 p-3 max-h-full"
              >
                <h3 className="mb-3 px-1 text-sm font-semibold text-slate-600 uppercase tracking-wider flex justify-between">
                  {column.title}
                  <span className="bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 text-xs">
                    {columnTasks.length}
                  </span>
                </h3>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex flex-1 flex-col gap-3 min-h-37.5 transition-colors rounded-lg ${snapshot.isDraggingOver ? "bg-slate-200/50" : ""}`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`transition-all ${snapshot.isDragging ? "shadow-lg ring-2 ring-blue-500/20 rotate-1" : "hover:border-blue-300"}`}
                            >
                              <CardHeader className="p-3 pb-0 flex flex-row items-start gap-2 space-y-0">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-0.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-medium text-slate-900 leading-snug">
                                  {task.title}
                                </p>
                              </CardHeader>
                              <CardContent className="p-3 pt-3 flex items-center justify-between ml-6">
                                <Badge
                                  variant="secondary"
                                  className="font-mono text-xs bg-slate-100 text-slate-600 hover:bg-slate-100"
                                >
                                  {task.key}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`border-none ${getPriorityColor(task.priority)} text-[10px] px-1.5 py-0`}
                                >
                                  {task.priority}
                                </Badge>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
