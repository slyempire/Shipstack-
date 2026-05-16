import React from 'react';
import { TaskManagement } from '../../components/TaskManagement';
import { motion } from 'framer-motion';

const TaskManagementView: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4"
    >
      <TaskManagement fullView={true} />
    </motion.div>
  );
};

export default TaskManagementView;
