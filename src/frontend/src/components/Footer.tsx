import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Knowledge Base</h3>
            <p className="text-gray-300">
              现代化的知识库管理系统，支持团队协作和权限控制。
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">功能特性</h3>
            <ul className="text-gray-300 space-y-2">
              <li>文档管理</li>
              <li>用户权限</li>
              <li>全文搜索</li>
              <li>团队协作</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">技术支持</h3>
            <ul className="text-gray-300 space-y-2">
              <li>React + Node.js</li>
              <li>PostgreSQL</li>
              <li>IAM权限系统</li>
              <li>JWT认证</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; 2025 Knowledge Base System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
