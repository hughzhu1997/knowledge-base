import React from 'react';
import { Link } from 'react-router-dom';

interface UnderConstructionProps {
  pageName?: string;
  description?: string;
  estimatedCompletion?: string;
}

const UnderConstruction: React.FC<UnderConstructionProps> = ({
  pageName = '此页面',
  description = '我们正在努力建设中，敬请期待！',
  estimatedCompletion = '未来几周',
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 md:p-12 max-w-2xl w-full text-center transform transition-all duration-300 hover:scale-105">
        <div className="text-6xl mb-6">🚧</div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4 leading-tight">
          {pageName} 建设中...
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          {description}
        </p>

        <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 mb-8">
          <div className="flex items-center text-gray-700 text-md">
            <span className="text-purple-500 mr-2">⏰</span>
            <span>预计完成: <span className="font-semibold">{estimatedCompletion}</span></span>
          </div>
          <div className="flex items-center text-gray-700 text-md">
            <span className="text-blue-500 mr-2">⚡</span>
            <span>功能预告: <span className="font-semibold">更强大的 {pageName}</span></span>
          </div>
        </div>

        <Link to="/dashboard" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
          <span className="mr-2">←</span>
          返回仪表盘
        </Link>
      </div>
    </div>
  );
};

export default UnderConstruction;
