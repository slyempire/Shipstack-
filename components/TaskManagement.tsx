import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  AlertCircle, 
  X, 
  MoreVertical,
  Clock,
  Check,
  User as UserIcon,
  Filter,
  Search,
  ChevronRight,
  ListTodo,
  History,
  Tag,
  Timer
} from 'lucide-react';
import { Task, Priority, User, SubTask, TaskActivity } from '../types';
import { api } from '../api';
import { useAuthStore, useAppStore } from '../store';
import { Badge } from '../packages/ui/Badge';
import Layout from './Layout';

const TaskDetailDrawer: React.FC<{
  task: Task;
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}> = ({ task, users, isOpen, onClose, onUpdate }) => {
  const [newSubtask, setNewSubtask] = useState('');
  const { user } = useAuthStore();

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const sub: SubTask = {
      id: `sub-${Date.now()}`,
      title: newSubtask,
      completed: false,
      createdAt: new Date().toISOString()
    };
    const updatedSubtasks = [...(task.subtasks || []), sub];
    
    const activity: TaskActivity = {
      id: `act-${Date.now()}`,
      userId: user?.id || 'system',
      userName: user?.name || 'System',
      action: `Added subtask: ${newSubtask}`,
      timestamp: new Date().toISOString()
    };
    
    onUpdate(task.id, { 
      subtasks: updatedSubtasks,
      history: [activity, ...(task.history || [])]
    });
    setNewSubtask('');
  };

  const toggleSubtask = (subId: string) => {
    const updated = task.subtasks?.map(s => 
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    onUpdate(task.id, { subtasks: updated });
  };

  return (
    <div className="fixed inset-0 z-[2005] flex justify-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col"
      >
        <div className="p-8 border-b border-line flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <Badge variant={task.completed ? 'delivered' : 'pending'}>
                  {task.status}
               </Badge>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.id}</span>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-ink">{task.title}</h3>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="label-mono mb-2 flex items-center gap-2"><UserIcon size={12}/> Assignee</p>
                <p className="text-xs font-bold text-ink">
                  {users.find(u => u.id === task.assignedTo)?.name || 'Unassigned'}
                </p>
             </div>
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="label-mono mb-2 flex items-center gap-2"><Calendar size={12}/> Due Date</p>
                <p className="text-xs font-bold text-ink">{task.dueDate || 'No target'}</p>
             </div>
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="label-mono mb-2 flex items-center gap-2"><Tag size={12}/> Category</p>
                <p className="text-xs font-bold text-ink uppercase tracking-tight">{task.category || 'General'}</p>
             </div>
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="label-mono mb-2 flex items-center gap-2"><Timer size={12}/> Est. Time</p>
                <p className="text-xs font-bold text-ink">{task.estimatedMinutes ? `${task.estimatedMinutes}m` : 'N/A'}</p>
             </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
             <p className="label-mono !text-slate-900 border-l-4 border-brand pl-3">Strategic Context</p>
             <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50/50 p-4 rounded-2xl italic">
                {task.description || 'No additional intelligence provided for this objective.'}
             </p>
          </div>

          {/* Subtasks */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <p className="label-mono !text-slate-900 flex items-center gap-2">
                   <ListTodo size={14} className="text-brand" /> Operational Checklist
                </p>
                <span className="text-[10px] font-black text-slate-400">
                   {task.subtasks?.filter(s => s.completed).length || 0}/{task.subtasks?.length || 0}
                </span>
             </div>
             
             <div className="space-y-2">
                {task.subtasks?.map(sub => (
                   <button 
                    key={sub.id}
                    onClick={() => toggleSubtask(sub.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all text-left group"
                   >
                      <div className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${
                         sub.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent'
                      }`}>
                         <Check size={12} strokeWidth={4} />
                      </div>
                      <span className={`text-[11px] font-bold tracking-tight ${sub.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                         {sub.title}
                      </span>
                   </button>
                ))}
                
                <div className="flex gap-2 pt-2">
                   <input 
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder="Add specific tactical step..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-bold outline-none focus:border-brand transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                   />
                   <button 
                      onClick={handleAddSubtask}
                      className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-brand transition-all shadow-lg"
                   >
                      <Plus size={18} />
                   </button>
                </div>
             </div>
          </div>

          {/* Activity Log */}
          <div className="space-y-4 pb-10">
             <p className="label-mono !text-slate-900 flex items-center gap-2">
                <History size={14} className="text-brand" /> Operation Ledger
             </p>
             <div className="space-y-4 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {task.history?.map(log => (
                   <div key={log.id} className="relative pl-8">
                      <div className="absolute left-[7px] top-2 h-2 w-2 rounded-full bg-slate-300 border-2 border-white" />
                      <p className="text-[10px] font-black text-ink uppercase tracking-tight mb-1">{log.action}</p>
                      <div className="flex items-center gap-2">
                         <span className="text-[9px] font-bold text-brand uppercase tracking-widest">{log.userName}</span>
                         <span className="text-[9px] font-medium text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                   </div>
                ))}
                {(!task.history || task.history.length === 0) && (
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest p-4 text-center italic">No ledger entries recorded.</p>
                )}
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const TaskModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (task: Partial<Task>) => void;
  users: User[];
}> = ({ isOpen, onClose, onSave, users }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [assignedTo, setAssignedTo] = useState('');
  const [category, setCategory] = useState('OPERATIONS');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-line flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-ink">Deploy Objective</h3>
            <p className="label-mono !text-slate-400">Tactical mission assignment</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSave({ 
            title, 
            description, 
            dueDate, 
            priority, 
            assignedTo, 
            status: 'TODO',
            category,
            estimatedMinutes
          });
          onClose();
        }} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            <label className="label-mono">Strategic Title</label>
            <input 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-line rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all font-bold text-ink"
              placeholder="e.g., Warehouse Vector Audit"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="label-mono">Sector/Category</label>
               <select 
                 value={category}
                 onChange={(e) => setCategory(e.target.value)}
                 className="w-full p-4 bg-slate-50 border border-line rounded-2xl font-bold text-ink"
               >
                 <option value="OPERATIONS">OPERATIONS</option>
                 <option value="FINANCE">FINANCE</option>
                 <option value="HR">HR</option>
                 <option value="FLEET">FLEET</option>
                 <option value="WAREHOUSE">WAREHOUSE</option>
               </select>
             </div>
             <div className="space-y-2">
               <label className="label-mono">Est. Duration (Min)</label>
               <input 
                 type="number"
                 value={estimatedMinutes}
                 onChange={(e) => setEstimatedMinutes(parseInt(e.target.value))}
                 className="w-full p-4 bg-slate-50 border border-line rounded-2xl font-bold text-ink"
               />
             </div>
          </div>

          <div className="space-y-2">
            <label className="label-mono">Mission Brief</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-line rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all font-medium text-ink h-24"
              placeholder="Primary objectives and constraints..."
            />
          </div>

          <div className="space-y-2">
            <label className="label-mono">Assigned Agent</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full p-4 pl-12 bg-slate-50 border border-line rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all font-bold text-ink appearance-none"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="label-mono">Deployment Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-4 pl-12 bg-slate-50 border border-line rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all font-bold text-ink"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="label-mono">Threat Level</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full p-4 bg-slate-50 border border-line rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all font-bold text-ink appearance-none"
              >
                <option value="LOW">LOW (ROUTINE)</option>
                <option value="MEDIUM">MEDIUM (IMPORTANT)</option>
                <option value="HIGH">HIGH (CRITICAL)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all font-sans"
            >
              Abort
            </button>
            <button 
              type="submit"
              className="flex-1 py-4 bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:bg-brand-accent hover:-translate-y-1 transition-all"
            >
              Deploy Mission
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const TaskItem = React.forwardRef<HTMLDivElement, { 
  task: Task; 
  users: User[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (task: Task) => void;
}>(({ task, users, onToggle, onDelete, onClick }, ref) => {
  const assignee = users.find(u => u.id === task.assignedTo);

  return (
    <motion.div 
      ref={ref}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onClick={() => onClick(task)}
      className={`group flex items-center gap-6 p-6 rounded-3xl border transition-all cursor-pointer ${
        task.completed 
          ? 'bg-slate-50/50 border-slate-100' 
          : 'bg-white border-line hover:border-brand/30 hover:shadow-xl'
      }`}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
          task.completed 
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
            : 'bg-slate-50 text-slate-300 hover:text-brand hover:bg-brand/5 border border-line'
        }`}
      >
        {task.completed ? <Check size={18} strokeWidth={3} /> : <Circle size={18} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={`text-sm font-black uppercase tracking-tight transition-all ${
            task.completed ? 'text-slate-400 line-through' : 'text-ink'
          }`}>
            {task.title}
          </h4>
          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
            task.priority === 'HIGH' ? 'bg-rose-50 text-rose-500' :
            task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' :
            'bg-slate-100 text-slate-500'
          }`}>
            {task.priority}
          </span>
          {task.category && (
             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest px-2 py-0.5 border border-slate-100 rounded-md">
                {task.category}
             </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <Clock size={12} />
            {task.dueDate || 'No date'}
          </div>
          
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <UserIcon size={12} />
            {assignee ? assignee.name : 'Unassigned'}
          </div>
          
          {task.subtasks && task.subtasks.length > 0 && (
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                <ListTodo size={10} />
                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
             </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
        >
          <X size={18} />
        </button>
        <div className="p-2 text-slate-300">
          <ChevronRight size={18} />
        </div>
      </div>
    </motion.div>
  );
});

export const TaskManagement: React.FC<{ fullView?: boolean }> = ({ fullView = false }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'TODO' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');
  
  const { user } = useAuthStore();
  const { addNotification } = useAppStore();

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle deep linking
  useEffect(() => {
    if (!loading && tasks.length > 0) {
       const params = new URLSearchParams(window.location.search);
       const taskId = params.get('id');
       if (taskId) {
          const task = tasks.find(t => t.id === taskId);
          if (task) setSelectedTask(task);
       }
    }
  }, [loading, tasks]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [taskData, userData] = await Promise.all([
        api.getTasks(user.tenantId || 'tenant-1'),
        api.getUsers(user.tenantId || 'tenant-1')
      ]);
      setTasks(Array.isArray(taskData) ? taskData : []);
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (err) {
      console.error('Failed to load task data:', err);
      setTasks([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    if (!user) return;
    try {
      const activity: TaskActivity = {
        id: `act-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        action: 'Objective deployed to grid',
        timestamp: new Date().toISOString()
      };

      const newTask = await api.createTask({
        ...taskData as any,
        completed: false,
        userId: user.id,
        tenantId: user.tenantId || 'tenant-1',
        history: [activity],
        subtasks: []
      });
      setTasks(prev => [newTask, ...prev]);
      addNotification('Task created.', 'success');
    } catch (err) {
      addNotification("Couldn't create the task. Please try again.", 'error');
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const updated = await api.updateTask(id, updates);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      if (selectedTask?.id === id) {
         setSelectedTask(updated);
      }
    } catch (err) {
      addNotification("Couldn't save the changes. Please try again.", 'error');
    }
  };

  const handleToggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const isCompleted = !task.completed;
      const activity: TaskActivity = {
        id: `act-${Date.now()}`,
        userId: user?.id || 'system',
        userName: user?.name || 'System',
        action: isCompleted ? 'Objective marked COMPLETED' : 'Objective reopened for action',
        timestamp: new Date().toISOString()
      };

      await handleUpdateTask(id, { 
        completed: isCompleted,
        status: isCompleted ? 'COMPLETED' : 'TODO',
        history: [activity, ...(task.history || [])]
      });
    } catch (err) {
      addNotification("Couldn't update the task. Please try again.", 'error');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!user) return;
    try {
      await api.deleteTask(id, user.tenantId || 'tenant-1');
      setTasks(prev => prev.filter(t => t.id !== id));
      addNotification('Task deleted.', 'info');
      if (selectedTask?.id === id) setSelectedTask(null);
    } catch (err) {
      addNotification("Couldn't delete the task. Please try again.", 'error');
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = filter === 'ALL' || (filter === 'TODO' && !t.completed) || (filter === 'COMPLETED' && t.completed);
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          (t.description?.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const content = (
    <div className={`space-y-6 ${fullView ? 'max-w-4xl mx-auto py-12' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className={`${fullView ? 'text-4xl' : 'text-xl'} font-black uppercase tracking-tighter text-ink`}>
            {fullView ? 'Tactical Command Hub' : 'Tactical Tasks'}
          </h3>
          <p className="label-mono !text-slate-400">Objective deployment & tracking</p>
        </div>
        <div className="flex items-center gap-3">
          {fullView && (
            <div className="relative hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search objectives..."
                className="pl-12 pr-4 py-3 bg-white border border-line rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-brand"
              />
            </div>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-12 w-12 bg-brand text-white rounded-2xl flex items-center justify-center shadow-xl shadow-brand/20 hover:bg-brand-accent hover:-translate-y-1 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {fullView && (
        <div className="flex items-center gap-2 pb-2 overflow-x-auto no-scrollbar">
          {(['ALL', 'TODO', 'COMPLETED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f 
                  ? 'bg-ink text-white shadow-lg' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="label-mono">Retrieving objectives...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-line"
            >
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {search ? 'No objectives matching search' : 'All objectives cleared'}
              </p>
            </motion.div>
          ) : (
            filteredTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                users={users}
                onToggle={handleToggleTask} 
                onDelete={handleDeleteTask}
                onClick={setSelectedTask}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <TaskModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleCreateTask} 
            users={users}
          />
        )}
        {selectedTask && (
          <TaskDetailDrawer 
            task={selectedTask}
            users={users}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleUpdateTask}
          />
        )}
      </AnimatePresence>
    </div>
  );

  return fullView ? (
    <Layout title="Tactical Command Hub">
      {content}
    </Layout>
  ) : content;
};
