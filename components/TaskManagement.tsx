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
  Check
} from 'lucide-react';
import { Task, Priority } from '../types';
import { api } from '../api';
import { useAuthStore, useAppStore } from '../store';

const TaskModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (task: Omit<Task, 'id' | 'completed' | 'userId' | 'tenantId'>) => void 
}> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');

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
            <h3 className="text-2xl font-black uppercase tracking-tighter text-ink">Create New Task</h3>
            <p className="label-mono !text-slate-400">Tactical objective assignment</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSave({ title, description, dueDate, priority, status: 'TODO' });
          onClose();
        }} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="label-mono">Task Title</label>
            <input 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-line rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all font-bold text-ink"
              placeholder="e.g., Reconcile warehouse inventory"
            />
          </div>

          <div className="space-y-2">
            <label className="label-mono">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-line rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all font-medium text-ink h-32"
              placeholder="Detailed tactical instructions..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="label-mono">Due Date</label>
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
              <label className="label-mono">Priority</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full p-4 bg-slate-50 border border-line rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all font-bold text-ink appearance-none"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-4 bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:bg-brand-accent hover:-translate-y-1 transition-all"
            >
              Create Task
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const TaskItem: React.FC<{ task: Task; onToggle: (id: string) => void }> = ({ task, onToggle }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`group flex items-center gap-6 p-6 rounded-3xl border transition-all ${
        task.completed 
          ? 'bg-slate-50/50 border-slate-100' 
          : 'bg-white border-line hover:border-brand/30 hover:shadow-xl'
      }`}
    >
      <button 
        onClick={() => onToggle(task.id)}
        className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
          task.completed 
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
            : 'bg-slate-50 text-slate-300 hover:text-brand hover:bg-brand/5 border border-line'
        }`}
      >
        {task.completed ? <Check size={18} strokeWidth={3} /> : <Circle size={18} />}
      </button>

      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-black uppercase tracking-tight transition-all ${
          task.completed ? 'text-slate-400 line-through' : 'text-ink'
        }`}>
          {task.title}
        </h4>
        <div className="flex items-center gap-4 mt-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <Clock size={12} />
            {task.dueDate}
          </div>
          <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
            task.priority === 'HIGH' ? 'bg-rose-50 text-rose-500' :
            task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' :
            'bg-slate-100 text-slate-500'
          }`}>
            {task.priority}
          </div>
        </div>
      </div>

      <button className="p-2 text-slate-300 hover:text-ink opacity-0 group-hover:opacity-100 transition-all">
        <MoreVertical size={18} />
      </button>
    </motion.div>
  );
};

export const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { addNotification } = useAppStore();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'completed' | 'userId' | 'tenantId'>) => {
    if (!user) return;
    try {
      const newTask = await api.createTask({
        ...taskData,
        completed: false,
        userId: user.id,
        tenantId: user.tenantId || 'default'
      });
      setTasks(prev => [newTask, ...prev]);
      addNotification('Task created successfully', 'success');
    } catch (err) {
      addNotification('Failed to create task', 'error');
    }
  };

  const handleToggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const updated = await api.updateTask(id, { completed: !task.completed });
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    } catch (err) {
      addNotification('Failed to update task', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-ink">Tactical Tasks</h3>
          <p className="label-mono !text-slate-400">Operational objective tracking</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-12 w-12 bg-brand text-white rounded-2xl flex items-center justify-center shadow-xl shadow-brand/20 hover:bg-brand-accent hover:-translate-y-1 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-line"
            >
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No active tasks</p>
            </motion.div>
          ) : (
            tasks.map(task => (
              <TaskItem key={task.id} task={task} onToggle={handleToggleTask} />
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
          />
        )}
      </AnimatePresence>
    </div>
  );
};
