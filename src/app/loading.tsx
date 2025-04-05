import React from "react";

const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
      <div className="w-16 h-16 border-4 border-blue-500 dark:border-blue-400 border-dashed rounded-full animate-spin"></div>
    </div>
  );
};

export default Loading;
