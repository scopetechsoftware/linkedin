import { useState } from 'react';
import { X, Menu } from 'lucide-react';
import Sidebar from '../Sidebar/Sidebar';

const MobileSidebar = ({ user, isOpen, onClose }) => {
    return (
        <>
            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}
            
            {/* Mobile Sidebar */}
            <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Sidebar</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto h-full">
                        <Sidebar user={user} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default MobileSidebar; 