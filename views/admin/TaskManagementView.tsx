import React from 'react';
import { TaskManagement } from '../../components/TaskManagement';
import Layout from '../../components/Layout';
import { motion } from 'framer-motion';

const TaskManagementView: React.FC = () => {
  return (
    <Layout title="Task Management" subtitle="System coordination and assignments">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        <TaskManagement fullView={false} />
      </motion.div>
    </Layout>
  );
};

export default TaskManagementView;
