import React from 'react';

const Modal = ({ isOpen, onClose, children, maxWidth = '500px' }) => {
    return (
        <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="modal-content" style={{ maxWidth }}>
                {children}
            </div>
        </div>
    );
};

export default Modal;
