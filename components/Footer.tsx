import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 px-4 md:px-8 border-t border-purple-500/20 mt-20">
      <div className="container mx-auto text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} Astral Motors Finance. All Rights Reserved.</p>
        <p className="text-sm mt-2">Financing subject to approval. All calculations are estimates. Consult with a certified financial advisor.</p>
        <div className="flex justify-center space-x-6 mt-4">
          <a href="#" className="hover:text-purple-400 transition-colors">X-Galaxy</a>
          <a href="#" className="hover:text-purple-400 transition-colors">Insta-Cluster</a>
          <a href="#" className="hover:text-purple-400 transition-colors">Face-System</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;